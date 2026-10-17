import Router from "express";
import {
    getProjectById,
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    getProjectMembers,
    addMembersToProject,
    updateMemberRole,
    deleteMember,
} from "../controllers/project.controllers.js";

import { validate } from "../middlewares/validator.middlewares.js";

import {
    createProjectValidator,
    addMemberToProjectValidator,
} from "../validators/index.js";

import {
    verifyJWT,
    validateProjectPermission,
} from "../middlewares/auth.middlewares.js";

import {
    AvailableUserRoles,
    UserRolesEnum,
    ProjectMemberRoleEnum,
    AvailableProjectMemberRoles,
} from "../utils/constants.js";

const router = Router();

router.use(verifyJWT);

router
    .route("/")
    .get(getProjects)
    .post(
        validateProjectPermission(),
        createProjectValidator(),
        validate,
        createProject,
    );

router
    .route("/:projectId")
    .get(validateProjectPermission(AvailableProjectMemberRoles), getProjectById)
    .put(
        validateProjectPermission([ProjectMemberRoleEnum.PROJECT_ADMIN]),
        createProjectValidator(),
        validate,
        updateProject,
    )
    .delete(validateProjectPermission(), deleteProject);

router
    .route("/:projectId/members")
    .get(
        validateProjectPermission(AvailableProjectMemberRoles),
        getProjectMembers,
    )
    .post(
        validateProjectPermission([ProjectMemberRoleEnum.PROJECT_ADMIN]),
        addMemberToProjectValidator(),
        validate,
        addMembersToProject,
    );

router
    .route("/:projectId/members/:userId")
    .put(
        validateProjectPermission([ProjectMemberRoleEnum.PROJECT_ADMIN]),
        updateMemberRole,
    )
    .delete(
        validateProjectPermission([ProjectMemberRoleEnum.PROJECT_ADMIN]),
        deleteMember,
    );

export default router;
