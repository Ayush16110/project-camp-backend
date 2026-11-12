import { Project } from "../models/project.models.js";
import { ProjectNote } from "../models/note.models.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import mongoose from "mongoose";
import { UserRolesEnum, ProjectMemberRoleEnum } from "../utils/constants.js";

const validateNotePermission = (note, req) => {
    if (req.user.role === UserRolesEnum.ADMIN) {
        return;
    }

    if (req.projectMembership.role === ProjectMemberRoleEnum.PROJECT_ADMIN) {
        return;
    }

    if (note.createdBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You can only modify your own notes");
    }
};

const getNotes = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!projectId || !mongoose.isValidObjectId(projectId)) {
        throw new ApiError(400, "Invalid or missing Project Id");
    }

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const notes = await ProjectNote.find({ project: projectId }).populate(
        "createdBy",
        "username fullName avatar",
    );

    return res
        .status(200)
        .json(new ApiResponse(200, notes, "Notes fetched successfully"));
});

const getNoteById = asyncHandler(async (req, res) => {
    const { projectId, noteId } = req.params;

    if (!projectId || !mongoose.isValidObjectId(projectId)) {
        throw new ApiError(400, "Invalid or missing Project Id");
    }

    if (!noteId || !mongoose.isValidObjectId(noteId)) {
        throw new ApiError(400, "Invalid or missing Note Id");
    }

    const note = await ProjectNote.findOne({
        _id: noteId,
        project: projectId,
    }).populate("createdBy", "username fullName avatar");

    if (!note) {
        throw new ApiError(404, "Note not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, note, "Note fetched successfully"));
});

const createNote = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { projectId } = req.params;

    if (!projectId || !mongoose.isValidObjectId(projectId)) {
        throw new ApiError(400, "Invalid or missing Project Id");
    }

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const note = await ProjectNote.create({
        content,
        project: new mongoose.Types.ObjectId(projectId),
        createdBy: new mongoose.Types.ObjectId(req.user._id),
    });

    return res
        .status(201)
        .json(new ApiResponse(201, note, "Note created successfully"));
});

const updateNote = asyncHandler(async (req, res) => {
    const { content } = req.body;
    const { projectId, noteId } = req.params;

    if (!projectId || !mongoose.isValidObjectId(projectId)) {
        throw new ApiError(400, "Invalid or missing Project Id");
    }

    if (!noteId || !mongoose.isValidObjectId(noteId)) {
        throw new ApiError(400, "Invalid or missing Note Id");
    }

    if (content === undefined) {
        throw new ApiError(400, "No data to update");
    }

    const note = await ProjectNote.findOne({
        _id: noteId,
        project: projectId,
    });

    if (!note) {
        throw new ApiError(404, "Note not found");
    }

    validateNotePermission(note, req);

    note.content = content;

    await note.save();

    return res
        .status(200)
        .json(new ApiResponse(200, note, "Note updated successfully"));
});

const deleteNote = asyncHandler(async (req, res) => {
    const { projectId, noteId } = req.params;

    if (!projectId || !mongoose.isValidObjectId(projectId)) {
        throw new ApiError(400, "Invalid or missing Project Id");
    }

    if (!noteId || !mongoose.isValidObjectId(noteId)) {
        throw new ApiError(400, "Invalid or missing Note Id");
    }

    const note = await ProjectNote.findOne({
        _id: noteId,
        project: projectId,
    });

    if (!note) {
        throw new ApiError(404, "Note not found");
    }

    validateNotePermission(note, req);

    await note.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Note deleted successfully"));
});

export { getNotes, getNoteById, createNote, updateNote, deleteNote };
