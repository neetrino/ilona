export type StudentDetailsAudience = 'staff' | 'teacher';

export type StudentDetailsVisibility = {
  email: boolean;
  dateOfBirth: boolean;
  monthlyFee: boolean;
  payments: boolean;
  parentEmail: boolean;
  parentPassport: boolean;
  openFullProfile: boolean;
  receiveReports: boolean;
  alwaysShowTeacher2: boolean;
  alwaysShowParentContact: boolean;
  useAdmissionDate: boolean;
};

export function getStudentDetailsVisibility(
  audience: StudentDetailsAudience = 'staff',
): StudentDetailsVisibility {
  const isStaff = audience !== 'teacher';
  return {
    email: isStaff,
    dateOfBirth: isStaff,
    monthlyFee: isStaff,
    payments: isStaff,
    parentEmail: isStaff,
    parentPassport: isStaff,
    openFullProfile: isStaff,
    receiveReports: isStaff,
    alwaysShowTeacher2: !isStaff,
    alwaysShowParentContact: !isStaff,
    useAdmissionDate: !isStaff,
  };
}
