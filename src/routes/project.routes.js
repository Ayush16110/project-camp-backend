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
import { AvailableUserRole, UserRoleEnum } from "../utils/constants.js";

const router = Router();

router.use(verifyJWT);

router
    .route("/")
    .get(getProjects)
    .post(createProjectValidator(), validate, createProject);

router
    .route("/:projectId")
    .get(validateProjectPermission(AvailableUserRole), getProjectById)
    .put(
        validateProjectPermission([
            UserRoleEnum.ADMIN,
            UserRoleEnum.PROJECT_ADMIN,
        ]),
        createProjectValidator(),
        validate,
        updateProject,
    )
    .delete(
        validateProjectPermission([
            UserRoleEnum.ADMIN,
            UserRoleEnum.PROJECT_ADMIN,
        ]),
        deleteProject,
    );

router
    .route("/:projectId/members")
    .get(validateProjectPermission(AvailableUserRole), getProjectMembers)
    .post(
        validateProjectPermission([
            UserRoleEnum.ADMIN,
            UserRoleEnum.PROJECT_ADMIN,
        ]),
        addMemberToProjectValidator(),
        validate,
        addMembersToProject,
    );

router
    .route("/:projectId/members/:userId")
    .put(
        validateProjectPermission([
            UserRoleEnum.ADMIN,
            UserRoleEnum.PROJECT_ADMIN,
        ]),
        updateMemberRole,
    )
    .delete(
        validateProjectPermission([
            UserRoleEnum.ADMIN,
            UserRoleEnum.PROJECT_ADMIN,
        ]),
        deleteMember,
    );

export default router;