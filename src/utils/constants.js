export const UserRolesEnum = {
    USER: "user",
    ADMIN: "admin",
};

export const AvailableUserRoles = Object.values(UserRolesEnum);

export const ProjectMemberRoleEnum = {
    PROJECT_ADMIN: "project_admin",
    MEMBER: "member",
};

export const AvailableProjectMemberRoles = Object.values(ProjectMemberRoleEnum);

export const TaskStatusEnum = {
    TODO: "todo",
    IN_PROGRESS: "in_progress",
    DONE: "done",
};

export const AvailableTaskStatus = Object.values(TaskStatusEnum);
