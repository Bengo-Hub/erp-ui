/**
 * Avatar Helper Utility
 * Generates avatar URLs using UI Avatars API for users without profile pictures
 * API: https://ui-avatars.com/
 */

/**
 * Generate avatar URL from user name or email using UI Avatars API
 * @param {string} name - User's full name or email
 * @param {Object} options - Customization options
 * @param {number} options.size - Image size in pixels (default: 128, max: 512)
 * @param {string} options.background - Background color hex without # (default: random)
 * @param {string} options.color - Text color hex without # (default: fff)
 * @param {number} options.fontSize - Font size 0.1-1 (default: 0.5)
 * @param {boolean} options.rounded - Rounded corners (default: true)
 * @param {boolean} options.bold - Bold text (default: true)
 * @param {number} options.length - Number of initials (default: 2)
 * @returns {string} - Avatar image URL
 */
export const generateAvatarUrl = (name, options = {}) => {
    if (!name) {
        name = 'User';
    }

    const {
        size = 128,
        background = 'random',
        color = 'fff',
        fontSize = 0.5,
        rounded = true,
        bold = true,
        length = 2
    } = options;

    const params = new URLSearchParams({
        name: name,
        size: size.toString(),
        background: background,
        color: color,
        'font-size': fontSize.toString(),
        rounded: rounded.toString(),
        bold: bold.toString(),
        length: length.toString()
    });

    return `https://ui-avatars.com/api/?${params.toString()}`;
};

/**
 * Generate avatar URL with business theme colors
 * @param {string} name - User's full name or email
 * @param {Object} businessColors - Business branding colors
 * @param {string} businessColors.primary - Primary color hex
 * @param {string} businessColors.text - Text color hex
 * @param {number} size - Image size
 * @returns {string} - Avatar image URL
 */
export const generateThemedAvatarUrl = (name, businessColors = {}, size = 128) => {
    const { primary = '1976D2', text = 'ffffff' } = businessColors;
    
    return generateAvatarUrl(name, {
        size,
        background: primary.replace('#', ''),
        color: text.replace('#', ''),
        rounded: true,
        bold: true
    });
};

/**
 * Get user avatar URL - returns profile pic if set, otherwise generates initials avatar
 * @param {Object} user - User object
 * @param {string} user.pic - User's profile picture URL
 * @param {string} user.first_name - User's first name
 * @param {string} user.last_name - User's last name
 * @param {string} user.email - User's email
 * @param {number} size - Image size
 * @returns {string} - Avatar URL
 */
export const getUserAvatarUrl = (user, size = 128) => {
    // Return profile pic if set
    if (user?.pic) {
        return user.pic;
    }

    // Generate name from first/last name or email
    let name = 'User';
    if (user?.first_name && user?.last_name) {
        name = `${user.first_name} ${user.last_name}`;
    } else if (user?.first_name) {
        name = user.first_name;
    } else if (user?.email) {
        name = user.email;
    }

    return generateAvatarUrl(name, { size });
};

export default {
    generateAvatarUrl,
    generateThemedAvatarUrl,
    getUserAvatarUrl
};

