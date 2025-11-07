/**
 * 前端加密存储工具模块
 * 使用 Web Crypto API 实现 AES-256-GCM 加密
 * 密钥派生使用 PBKDF2
 */

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12 // GCM推荐使用12字节IV
const SALT_LENGTH = 16
const PBKDF2_ITERATIONS = 100000 // 迭代次数，平衡安全性和性能

/**
 * 从用户密码派生加密密钥
 * @param password 用户密码
 * @param salt 盐值
 * @returns CryptoKey
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * 生成随机盐值
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
}

/**
 * 生成随机IV
 */
function generateIV(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(IV_LENGTH))
}

/**
 * 加密数据
 * @param plaintext 明文数据
 * @param password 用户密码（用于派生密钥）
 * @returns 加密后的数据（格式：salt + iv + ciphertext）
 */
export async function encrypt(plaintext: string, password: string): Promise<string> {
  try {
    const salt = generateSalt()
    const iv = generateIV()
    const key = await deriveKey(password, salt)

    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)

    const ciphertext = await crypto.subtle.encrypt(
      {
        name: ALGORITHM,
        iv: iv
      },
      key,
      data
    )

    // 将 salt + iv + ciphertext 组合并转换为 base64
    const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length)

    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('加密失败:', error)
    throw new Error('数据加密失败，请重试')
  }
}

/**
 * 解密数据
 * @param ciphertext 加密后的数据（base64格式）
 * @param password 用户密码（用于派生密钥）
 * @returns 解密后的明文
 */
export async function decrypt(ciphertext: string, password: string): Promise<string> {
  try {
    // 从 base64 解码
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))

    // 提取 salt, iv 和加密数据
    const salt = combined.slice(0, SALT_LENGTH)
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
    const encryptedData = combined.slice(SALT_LENGTH + IV_LENGTH)

    const key = await deriveKey(password, salt)

    const decrypted = await crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv
      },
      key,
      encryptedData
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  } catch (error) {
    console.error('解密失败:', error)
    throw new Error('数据解密失败，密码可能错误')
  }
}

/**
 * 生成安全的随机ID
 */
export function generateId(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

