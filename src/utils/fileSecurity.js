/**
 * File Security Utilities for ERP Frontend
 * 
 * Provides client-side file validation and security checks for uploaded files.
 * This complements the backend security scanning by performing early validation.
 */

/**
 * File type definitions with magic bytes and MIME types
 */
const FILE_SIGNATURES = {
    // Image formats
    jpeg: {
        signatures: [[0xFF, 0xD8, 0xFF]],
        mimes: ['image/jpeg', 'image/jpg'],
        extensions: ['.jpg', '.jpeg']
    },
    png: {
        signatures: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
        mimes: ['image/png'],
        extensions: ['.png']
    },
    gif: {
        signatures: [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
        mimes: ['image/gif'],
        extensions: ['.gif']
    },
    webp: {
        signatures: [[0x52, 0x49, 0x46, 0x46]], // RIFF header (need to check WEBP at offset 8)
        mimes: ['image/webp'],
        extensions: ['.webp']
    },
    bmp: {
        signatures: [[0x42, 0x4D]],
        mimes: ['image/bmp'],
        extensions: ['.bmp']
    },
    // Document formats
    pdf: {
        signatures: [[0x25, 0x50, 0x44, 0x46]], // %PDF
        mimes: ['application/pdf'],
        extensions: ['.pdf']
    },
    zip: {
        signatures: [[0x50, 0x4B, 0x03, 0x04], [0x50, 0x4B, 0x05, 0x06]],
        mimes: ['application/zip'],
        extensions: ['.zip']
    }
};

/**
 * Size limits by file category (in bytes)
 */
const SIZE_LIMITS = {
    signature: 2 * 1024 * 1024,      // 2MB for signatures
    stamp: 5 * 1024 * 1024,          // 5MB for stamps
    profilePic: 5 * 1024 * 1024,     // 5MB for profile pictures
    document: 50 * 1024 * 1024,      // 50MB for documents
    image: 10 * 1024 * 1024,         // 10MB for general images
    default: 10 * 1024 * 1024        // 10MB default
};

/**
 * Allowed extensions by category
 */
const ALLOWED_EXTENSIONS = {
    signature: ['.png', '.jpg', '.jpeg', '.webp'],
    stamp: ['.png', '.jpg', '.jpeg', '.webp'],
    profilePic: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    image: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'],
    document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv']
};

/**
 * Dangerous content patterns to check for in files
 */
const DANGEROUS_PATTERNS = [
    '<?php',
    '<%',
    '<script',
    'javascript:',
    'eval(',
    'exec(',
    'system(',
    'shell_exec',
    'passthru'
];

/**
 * Read file as ArrayBuffer
 * @param {File} file 
 * @returns {Promise<ArrayBuffer>}
 */
async function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Read file as text
 * @param {File} file 
 * @returns {Promise<string>}
 */
async function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Check if file matches a signature
 * @param {Uint8Array} bytes 
 * @param {number[]} signature 
 * @returns {boolean}
 */
function matchesSignature(bytes, signature) {
    if (bytes.length < signature.length) return false;
    return signature.every((byte, index) => bytes[index] === byte);
}

/**
 * Detect file type from magic bytes
 * @param {ArrayBuffer} buffer 
 * @returns {string|null} Detected file type key or null
 */
function detectFileType(buffer) {
    const bytes = new Uint8Array(buffer.slice(0, 20));
    
    for (const [type, info] of Object.entries(FILE_SIGNATURES)) {
        for (const signature of info.signatures) {
            if (matchesSignature(bytes, signature)) {
                // Special handling for WebP (check WEBP at offset 8)
                if (type === 'webp') {
                    const webpCheck = new Uint8Array(buffer.slice(8, 12));
                    const webpSignature = [0x57, 0x45, 0x42, 0x50]; // WEBP
                    if (!matchesSignature(webpCheck, webpSignature)) {
                        continue;
                    }
                }
                return type;
            }
        }
    }
    
    return null;
}

/**
 * Check for dangerous content patterns
 * @param {string} content 
 * @returns {string[]} List of detected dangerous patterns
 */
function checkDangerousPatterns(content) {
    const detected = [];
    const lowerContent = content.toLowerCase();
    
    for (const pattern of DANGEROUS_PATTERNS) {
        if (lowerContent.includes(pattern.toLowerCase())) {
            detected.push(pattern);
        }
    }
    
    return detected;
}

/**
 * Validate file extension
 * @param {string} filename 
 * @param {string} category 
 * @returns {boolean}
 */
function validateExtension(filename, category = 'image') {
    if (!filename) return false;
    
    const ext = '.' + filename.toLowerCase().split('.').pop();
    const allowed = ALLOWED_EXTENSIONS[category] || ALLOWED_EXTENSIONS.image;
    return allowed.includes(ext);
}

/**
 * Validate file size
 * @param {File} file 
 * @param {string} category 
 * @returns {{isValid: boolean, actualSize: number, maxSize: number}}
 */
function validateFileSize(file, category = 'default') {
    const maxSize = SIZE_LIMITS[category] || SIZE_LIMITS.default;
    return {
        isValid: file.size <= maxSize,
        actualSize: file.size,
        maxSize
    };
}

/**
 * Comprehensive file security scan
 * @param {File} file - File to scan
 * @param {string} category - File category (signature, stamp, profilePic, image, document)
 * @param {Object} options - Additional options
 * @returns {Promise<{isSafe: boolean, errors: string[], warnings: string[], detectedType: string|null}>}
 */
export async function scanFile(file, category = 'image', options = {}) {
    const result = {
        isSafe: true,
        errors: [],
        warnings: [],
        detectedType: null,
        fileSize: file.size
    };
    
    try {
        // 1. Validate file size
        const sizeCheck = validateFileSize(file, category);
        if (!sizeCheck.isValid) {
            const maxMB = (sizeCheck.maxSize / 1024 / 1024).toFixed(1);
            const actualMB = (sizeCheck.actualSize / 1024 / 1024).toFixed(1);
            result.errors.push(`File too large: ${actualMB}MB (max ${maxMB}MB)`);
            result.isSafe = false;
        }
        
        // 2. Validate extension
        if (!validateExtension(file.name, category)) {
            const allowed = ALLOWED_EXTENSIONS[category] || ALLOWED_EXTENSIONS.image;
            result.errors.push(`Invalid file extension. Allowed: ${allowed.join(', ')}`);
            result.isSafe = false;
        }
        
        // 3. Read file and detect actual type
        const buffer = await readFileAsArrayBuffer(file);
        const detectedType = detectFileType(buffer);
        result.detectedType = detectedType;
        
        // 4. Check for type mismatch
        const claimedMime = file.type;
        if (detectedType) {
            const typeInfo = FILE_SIGNATURES[detectedType];
            if (typeInfo && !typeInfo.mimes.includes(claimedMime)) {
                result.warnings.push(`File type mismatch: claimed ${claimedMime}, detected ${detectedType}`);
            }
        } else if (category !== 'document') {
            // Unknown type for non-document category
            result.warnings.push('Could not verify file type from content');
        }
        
        // 5. Check for dangerous patterns (for smaller files only)
        if (file.size < 1 * 1024 * 1024) { // Only check files under 1MB
            try {
                const textContent = await readFileAsText(file);
                const dangerous = checkDangerousPatterns(textContent);
                if (dangerous.length > 0) {
                    result.errors.push(`Suspicious content detected: ${dangerous.slice(0, 3).join(', ')}`);
                    result.isSafe = false;
                }
            } catch {
                // Binary file, skip text pattern check
            }
        }
        
        // 6. For images, validate dimensions using Image API
        if (['signature', 'stamp', 'profilePic', 'image'].includes(category)) {
            try {
                const imgValidation = await validateImageDimensions(file, category);
                if (!imgValidation.isValid) {
                    result.errors.push(imgValidation.error);
                    result.isSafe = false;
                }
            } catch (e) {
                result.errors.push(`Invalid image file: ${e.message}`);
                result.isSafe = false;
            }
        }
        
    } catch (error) {
        result.errors.push(`Scan error: ${error.message}`);
        result.isSafe = false;
    }
    
    return result;
}

/**
 * Validate image dimensions
 * @param {File} file 
 * @param {string} category 
 * @returns {Promise<{isValid: boolean, width: number, height: number, error: string|null}>}
 */
async function validateImageDimensions(file, category) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = () => {
            URL.revokeObjectURL(url);
            
            const width = img.width;
            const height = img.height;
            
            // Check dimensions
            if (width > 10000 || height > 10000) {
                resolve({
                    isValid: false,
                    width,
                    height,
                    error: 'Image too large (max 10000x10000 pixels)'
                });
                return;
            }
            
            if (width < 10 || height < 10) {
                resolve({
                    isValid: false,
                    width,
                    height,
                    error: 'Image too small (min 10x10 pixels)'
                });
                return;
            }
            
            // Category-specific dimension checks
            if (category === 'signature') {
                if (width > 2000 || height > 1000) {
                    resolve({
                        isValid: false,
                        width,
                        height,
                        error: 'Signature too large (max 2000x1000 pixels recommended)'
                    });
                    return;
                }
            }
            
            resolve({
                isValid: true,
                width,
                height,
                error: null
            });
        };
        
        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };
        
        img.src = url;
    });
}

/**
 * Scan signature file
 * @param {File} file 
 * @returns {Promise<{isSafe: boolean, errors: string[], warnings: string[]}>}
 */
export async function scanSignatureFile(file) {
    return scanFile(file, 'signature');
}

/**
 * Scan stamp file
 * @param {File} file 
 * @returns {Promise<{isSafe: boolean, errors: string[], warnings: string[]}>}
 */
export async function scanStampFile(file) {
    return scanFile(file, 'stamp');
}

/**
 * Scan profile picture
 * @param {File} file 
 * @returns {Promise<{isSafe: boolean, errors: string[], warnings: string[]}>}
 */
export async function scanProfileImage(file) {
    return scanFile(file, 'profilePic');
}

/**
 * Validate and scan uploaded file (throws on failure)
 * @param {File} file 
 * @param {string} category 
 * @throws {Error} If file is unsafe
 * @returns {Promise<{isSafe: boolean, errors: string[], warnings: string[]}>}
 */
export async function validateUploadedFile(file, category = 'image') {
    const result = await scanFile(file, category);
    
    if (!result.isSafe) {
        throw new Error(result.errors.join('; '));
    }
    
    return result;
}

export default {
    scanFile,
    scanSignatureFile,
    scanStampFile,
    scanProfileImage,
    validateUploadedFile,
    validateExtension,
    validateFileSize,
    SIZE_LIMITS,
    ALLOWED_EXTENSIONS
};
