import { Router } from "express";
import {
    createTask,
    getTasks,
    getTaskById,
    updateTask,
    createSubTask,
    updateSubTask,
    deleteSubTask,
    deleteTask,
} from "../controllers/task.controllers.js";
import {
    addTaskToProjectValidator,
    updateTaskValidator,
    createSubTaskValidator,
    updateSubTaskValidator,
} from "../validators/index.js";
import { validate } from "../middlewares/validator.middlewares.js";
import {
    verifyJWT,
    validateProjectPermission,
} from "../middlewares/auth.middlewares.js";
import {
    AvailableProjectMemberRoles,
    ProjectMemberRoleEnum,
} from "../utils/constants.js";
import { upload } from "../middlewares/multer.middlewares.js";

const router = Router();

router.use(verifyJWT);

router
    .route("/:projectId")
    .get(validateProjectPermission(AvailableProjectMemberRoles), getTasks)
    .post(
        validateProjectPermission([ProjectMemberRoleEnum.PROJECT_ADMIN]),
        upload.array("attachments"),
        addTaskToProjectValidator(),
        validate,
        createTask,
    );

router
    .route("/:projectId/t/:taskId")
    .get(validateProjectPermission(AvailableProjectMemberRoles), getTaskById)
    .put(
        validateProjectPermission([ProjectMemberRoleEnum.PROJECT_ADMIN]),
        upload.array("attachments"),
        updateTaskValidator(),
        validate,
        updateTask,
    )
    .delete(
        validateProjectPermission([ProjectMemberRoleEnum.PROJECT_ADMIN]),
        deleteTask,
    );

router
    .route("/:projectId/t/:taskId/subtasks")
    .post(
        validateProjectPermission([ProjectMemberRoleEnum.PROJECT_ADMIN]),
        createSubTaskValidator(),
        validate,
        createSubTask,
    );

router
    .route("/:projectId/st/:subTaskId")
    .put(
        validateProjectPermission(AvailableProjectMemberRoles),
        updateSubTaskValidator(),
        validate,
        updateSubTask,
    )
    .delete(
        validateProjectPermission([ProjectMemberRoleEnum.PROJECT_ADMIN]),
        deleteSubTask,
    );

export default router;
