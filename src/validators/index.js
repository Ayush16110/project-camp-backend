import { body } from "express-validator";
import {
    AvailableProjectMemberRoles,
    AvailableTaskStatus,
} from "../utils/constants.js";

const userRegisterValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Email is invalid"),

        body("username")
            .trim()
            .notEmpty()
            .withMessage("Username is required")
            .isLength({
                min: 4,
            })
            .withMessage("Length of username must be more than 3"),

        body("password").trim().notEmpty().withMessage("Password is required"),
    ];
};

const userLoginValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Invalid Emaill"),

        body("password").trim().notEmpty().withMessage("Password is required"),
    ];
};

const userChangeCurrentPasswordValidator = () => {
    return [
        body("oldPassword")
            .trim()
            .notEmpty()
            .withMessage("Password is required"),
        body("newPassword")
            .trim()
            .notEmpty()
            .withMessage("Password is required"),
    ];
};

const userForgotPasswordValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Invalid Emaill"),
    ];
};

const userResetForgotPasswordValidator = () => {
    return [
        body("newPassword")
            .trim()
            .notEmpty()
            .withMessage("Password is required"),
    ];
};

const createProjectValidator = () => {
    return [
        body("name").trim().notEmpty().withMessage("Project name is required"),
        body("description").trim().optional(),
    ];
};

const addMemberToProjectValidator = () => {
    return [
        body("email")
            .trim()
            .notEmpty()
            .withMessage("Email is required")
            .isEmail()
            .withMessage("Invalid Emaill"),
        body("role")
            .trim()
            .notEmpty()
            .withMessage("Role is required")
            .isIn(AvailableProjectMemberRoles)
            .withMessage("Invalid Role"),
    ];
};

const addTaskToProjectValidator = () => {
    return [
        body("title").trim().notEmpty().withMessage("Title is required"),

        body("description").optional().trim(),

        body("assignedTo")
            .optional()
            .isMongoId()
            .withMessage("Invalid assignee ID"),

        body("status")
            .optional()
            .trim()
            .isIn(AvailableTaskStatus)
            .withMessage("Invalid Status"),
    ];
};

const updateTaskValidator = () => {
    return [
        body("title")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Title cannot be empty"),

        body("description").optional().trim(),

        body("assignedTo")
            .optional()
            .isMongoId()
            .withMessage("Invalid assignee ID"),

        body("status")
            .optional()
            .trim()
            .isIn(AvailableTaskStatus)
            .withMessage("Invalid Status"),

        body("removeAttachments")
            .optional()
            .custom((value) => {
                let attachments;

                try {
                    attachments = JSON.parse(value);
                } catch {
                    throw new Error(
                        "removeAttachments must be a valid JSON array",
                    );
                }

                if (
                    !Array.isArray(attachments) ||
                    !attachments.every(
                        (url) => typeof url === "string" && url.trim(),
                    )
                ) {
                    throw new Error(
                        "removeAttachments must contain attachment URLs",
                    );
                }

                return true;
            }),
    ];
};

const createSubTaskValidator = () => {
    return [
        body("title")
            .trim()
            .notEmpty()
            .withMessage("Subtask title is required"),

        body("description").optional().trim(),
    ];
};

const updateSubTaskValidator = () => {
    return [
        body("title")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Title cannot be empty"),

        body("description").optional().trim(),

        body("isCompleted")
            .optional()
            .isBoolean()
            .withMessage("isCompleted must be a boolean"),
    ];
};

const createNoteValidator = () => {
    return [
        body("content")
            .trim()
            .notEmpty()
            .withMessage("Note content is required"),
    ];
};

const updateNoteValidator = () => {
    return [
        body("content")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Note content cannot be empty"),
    ];
};

export {
    userRegisterValidator,
    userLoginValidator,
    userChangeCurrentPasswordValidator,
    userForgotPasswordValidator,
    userResetForgotPasswordValidator,
    createProjectValidator,
    addMemberToProjectValidator,
    addTaskToProjectValidator,
    updateTaskValidator,
    createSubTaskValidator,
    updateSubTaskValidator,
    createNoteValidator,
    updateNoteValidator,
};
