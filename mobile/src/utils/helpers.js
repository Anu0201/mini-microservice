export const isPrefixCurrency = (currency) => currency === 'USD' || currency === 'EUR';

export const normalizePhone = (phone) => String(phone ?? '').replace(/\D/g, '');

const AVATAR_COLORS_FALLBACK = ['#7c3aed', '#FF5D9E', '#8F71FF', '#82ACFF', '#8BFFFF'];
export const avatarColor = (name, colors) => {
    const palette = colors
        ? [colors.primary, colors.accent, colors.secondary, colors.primaryLight, colors.muted]
        : AVATAR_COLORS_FALLBACK;
    if (!name) return palette[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = hash * 31 + name.charCodeAt(i);
    return palette[Math.abs(hash) % palette.length];
};
