export const isPrefixCurrency = (currency) => currency === 'USD' || currency === 'EUR';

const AVATAR_COLORS = ['#7c3aed', '#FF5D9E', '#8F71FF', '#82ACFF', '#8BFFFF'];
export const avatarColor = (name) => {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = hash * 31 + name.charCodeAt(i);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export const maskName = (name) => {
    if (!name || name.length <= 3) return name ?? '';
    return name[0] + name[1] + '•••' + name[name.length - 1];
};

export const initials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    return parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : parts[0].slice(0, 2).toUpperCase();
};
