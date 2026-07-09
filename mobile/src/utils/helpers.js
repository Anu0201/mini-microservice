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
