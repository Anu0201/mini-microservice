export const isPrefixCurrency = (currency) => currency === 'USD' || currency === 'EUR';

export const normalizePhone = (phone) => String(phone ?? '').replace(/\D/g, '');

const AVATAR_COLORS = ['#7c3aed', '#FF5D9E', '#8F71FF', '#82ACFF', '#8BFFFF'];
export const avatarColor = (name) => {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = hash * 31 + name.charCodeAt(i);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};
