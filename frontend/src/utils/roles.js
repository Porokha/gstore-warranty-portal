export const ROLE = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  SUPER_TECHNICIAN: 'super_technician',
  TECHNICIAN: 'technician',
};

export const isManagementRole = (role) =>
  [ROLE.ADMIN, ROLE.MANAGER, ROLE.SUPER_TECHNICIAN].includes(role);

export const isTechnicianRole = (role) =>
  [ROLE.TECHNICIAN, ROLE.SUPER_TECHNICIAN].includes(role);

export const hasFinanceStatisticsAccess = (role) =>
  [ROLE.ADMIN, ROLE.SUPER_TECHNICIAN].includes(role);

export const roleLabel = (role) => {
  const labels = {
    [ROLE.ADMIN]: 'Admin',
    [ROLE.MANAGER]: 'Manager',
    [ROLE.SUPER_TECHNICIAN]: 'Super Technician',
    [ROLE.TECHNICIAN]: 'Technician',
  };
  return labels[role] || role || 'User';
};
