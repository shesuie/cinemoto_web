export function homeFor(user) {
    return user?.staff ? '/admin/dashboard' : '/';
}
