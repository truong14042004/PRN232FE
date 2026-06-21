// Trả về đường dẫn mặc định sau khi đăng nhập, theo vai trò người dùng.
// Ưu tiên vai trò quyền cao nhất để vào trang phù hợp, tránh văng /403.
export function homePathForRoles(roles = []) {
  if (!roles || roles.length === 0) return '/lot-info'
  if (roles.includes('Admin') || roles.includes('FacilityManager')) return '/'
  if (roles.includes('ParkingStaff')) return '/sessions'
  // Driver hoặc vai trò khác
  return '/my-sessions'
}
