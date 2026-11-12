import { Router } from "express";
import {
    verifyJWT,
    validateProjectPermission,
} from "../middlewares/auth.middlewares.js";
import {
    createNote,
    deleteNote,
    getNoteById,
    getNotes,
    updateNote,
} from "../controllers/note.controllers.js";
import { validate } from "../middlewares/validator.middlewares.js";
import {
    createNoteValidator,
    updateNoteValidator,
} from "../validators/index.js";
import { AvailableProjectMemberRoles } from "../utils/constants.js";

const router = Router();

router.use(verifyJWT);

router
    .route("/:projectId")
    .get(validateProjectPermission(AvailableProjectMemberRoles), getNotes)
    .post(
        validateProjectPermission(AvailableProjectMemberRoles),
        createNoteValidator(),
        validate,
        createNote,
    );

router
    .route("/:projectId/n/:noteId")
    .get(validateProjectPermission(AvailableProjectMemberRoles), getNoteById)
    .put(
        validateProjectPermission(AvailableProjectMemberRoles),
        updateNoteValidator(),
        validate,
        updateNote,
    )
    .delete(validateProjectPermission(AvailableProjectMemberRoles), deleteNote);

export default router;
