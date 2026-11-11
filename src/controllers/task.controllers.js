import { Project } from "../models/project.models.js";
import { User } from "../models/user.models.js";
import { Task } from "../models/task.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { SubTask } from "../models/subtask.models.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import mongoose from "mongoose";
import { UserRolesEnum, ProjectMemberRoleEnum } from "../utils/constants.js";

const getTasks = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    if (!projectId) {
        throw new ApiError(400, "Invalid or missing Project Id");
    }

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const tasks =
        (await Task.find({ project: projectId }).populate(
            "assignedTo",
            "avatar fullName username",
        )) || [];

    return res
        .status(200)
        .json(new ApiResponse(200, tasks, "Tasks fetched successfully"));
});

const getTaskById = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;

    if (!projectId || !mongoose.isValidObjectId(projectId)) {
        throw new ApiError(400, "Invalid or missing Project Id");
    }

    if (!taskId || !mongoose.isValidObjectId(taskId)) {
        throw new ApiError(400, "Invalid or missing Task Id");
    }

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const task = await Task.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(taskId),
                project: new mongoose.Types.ObjectId(projectId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "assignedTo",
                foreignField: "_id",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            userName: 1,
                            fullName: 1,
                            avatar: 1,
                        },
                    },
                ],
                as: "assignedTo",
            },
        },
        {
            $addFields: {
                assignedTo: {
                    $first: "$assignedTo",
                },
            },
        },
        {
            $lookup: {
                from: "subtasks",
                localField: "_id",
                foreignField: "task",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "createdBy",
                            foreignField: "_id",
                            pipeline: [
                                {
                                    $project: {
                                        _id: 1,
                                        userName: 1,
                                        fullName: 1,
                                        avatar: 1,
                                    },
                                },
                            ],
                            as: "createdBy",
                        },
                    },
                    {
                        $addFields: {
                            createdBy: {
                                $first: "$createdBy",
                            },
                        },
                    },
                ],
                as: "subtasks",
            },
        },
    ]);

    if (!task || task.length === 0) {
        throw new ApiError(404, "Task not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, task[0], "Task fetched successfully"));
});

const createTask = asyncHandler(async (req, res) => {
    const { title, description, assignedTo, status } = req.body;
    const { projectId } = req.params;

    if (!projectId || !mongoose.isValidObjectId(projectId)) {
        throw new ApiError(400, "Invalid or missing Project Id");
    }

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const assigneeId = assignedTo || req.user._id;

    const assignee = await User.findById(assigneeId).select("_id");

    if (!assignee) {
        throw new ApiError(404, "Assignee not found");
    }

    const membership = await ProjectMember.findOne({
        user: new mongoose.Types.ObjectId(assigneeId),
        project: new mongoose.Types.ObjectId(projectId),
    });

    if (!membership) {
        throw new ApiError(403, "Assignee must be member of this project");
    }

    const files = req.files || [];

    const attachments = files.map((file) => {
        return {
            url: `${process.env.SERVER_URL}/uploads/${file.filename}`,
            mimeType: file.mimetype,
            size: file.size,
        };
    });

    const task = await Task.create({
        title,
        description,
        assignedTo: assigneeId,
        project: projectId,
        assignedBy: req.user._id,
        ...(status && { status }),
        attachments,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, task, "Task created successfully"));
});

const updateTask = asyncHandler(async (req, res) => {
    const { title, description, assignedTo, status, removeAttachments } =
        req.body;
    const { projectId, taskId } = req.params;
    const files = req.files || [];

    if (!projectId || !mongoose.isValidObjectId(projectId)) {
        throw new ApiError(400, "Invalid or missing Project Id");
    }

    if (!taskId || !mongoose.isValidObjectId(taskId)) {
        throw new ApiError(400, "Invalid or missing Task Id");
    }

    if (
        title === undefined &&
        description === undefined &&
        assignedTo === undefined &&
        status === undefined &&
        removeAttachments === undefined &&
        files.length === 0
    ) {
        throw new ApiError(400, "No data to update");
    }

    const task = await Task.findOne({
        _id: taskId,
        project: projectId,
    });

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    if (title !== undefined) task.title = title;

    if (description !== undefined) task.description = description;

    if (status !== undefined) task.status = status;

    if (assignedTo !== undefined) {
        if (!mongoose.isValidObjectId(assignedTo)) {
            throw new ApiError(400, "Invalid Assignee Id");
        }

        const assignee = await User.findById(assignedTo).select("_id");

        if (!assignee) {
            throw new ApiError(404, "Assignee not found");
        }

        const membership = await ProjectMember.findOne({
            user: assignedTo,
            project: projectId,
        });

        if (!membership) {
            throw new ApiError(
                403,
                "Assignee must be a member of this project",
            );
        }

        task.assignedTo = assignedTo;
    }

    if (removeAttachments !== undefined) {
        const urls = JSON.parse(removeAttachments);

        const existingUrls = task.attachments.map(
            (attachment) => attachment.url,
        );

        const invalidUrls = urls.filter((url) => !existingUrls.includes(url));

        if (invalidUrls.length > 0) {
            throw new ApiError(
                400,
                "One or more attachments do not belong to this task",
            );
        }

        task.attachments = task.attachments.filter(
            (attachment) => !urls.includes(attachment.url),
        );
    }

    if (files.length > 0) {
        task.attachments = [
            ...task.attachments,
            ...files.map((file) => {
                return {
                    url: `${process.env.SERVER_URL}/uploads/${file.filename}`,
                    mimeType: file.mimetype,
                    size: file.size,
                };
            }),
        ];
    }

    await task.save();

    return res
        .status(200)
        .json(new ApiResponse(200, task, "Task updated successfully"));
});

const deleteTask = asyncHandler(async (req, res) => {
    const { projectId, taskId } = req.params;

    if (
        !mongoose.isValidObjectId(projectId) ||
        !mongoose.isValidObjectId(taskId)
    ) {
        throw new ApiError(400, "Invalid Project Id or Task Id");
    }

    const task = await Task.findOne({
        _id: taskId,
        project: projectId,
    });

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    await SubTask.deleteMany({ task: task._id });

    await Task.findByIdAndDelete(task._id);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Task and its subtasks deleted successfully",
            ),
        );
});

const createSubTask = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const { projectId, taskId } = req.params;

    if (!taskId || !mongoose.isValidObjectId(taskId)) {
        throw new ApiError(400, "Task id is invalid");
    }

    if (!projectId || !mongoose.isValidObjectId(projectId)) {
        throw new ApiError(400, "Project id is invalid");
    }

    const task = await Task.findOne({
        _id: taskId,
        project: projectId,
    });

    if (!task) {
        throw new ApiError(404, "Task not found");
    }

    const subtask = await SubTask.create({
        title,
        description,
        task: new mongoose.Types.ObjectId(task._id),
        createdBy: new mongoose.Types.ObjectId(req.user._id),
    });

    return res
        .status(201)
        .json(new ApiResponse(201, subtask, "Subtask created successfully"));
});

const updateSubTask = asyncHandler(async (req, res) => {
    const { projectId, subTaskId } = req.params;
    const { title, description, isCompleted } = req.body;

    if (
        !mongoose.isValidObjectId(projectId) ||
        !mongoose.isValidObjectId(subTaskId)
    ) {
        throw new ApiError(400, "Invalid project id or subtask id");
    }

    if (
        title == undefined &&
        description == undefined &&
        isCompleted == undefined
    ) {
        throw new ApiError(400, "No data to update");
    }

    const subtask = await SubTask.findById(subTaskId).populate(
        "task",
        "project",
    );

    if (!subtask || !subtask.task) {
        throw new ApiError(404, "Subtask not found");
    }

    if (subtask.task.project.toString() !== projectId) {
        throw new ApiError(403, "Subtask does not belong to this project");
    }

    const projectmember = await ProjectMember.findOne({
        user: req.user._id,
        project: projectId,
    }).select("role");

    if (
        req.user.role !== UserRolesEnum.ADMIN &&
        projectmember.role !== ProjectMemberRoleEnum.PROJECT_ADMIN &&
        (title !== undefined || description !== undefined)
    ) {
        throw new ApiError(
            403,
            "Members can only update SubTask completion status",
        );
    }

    if (title !== undefined) subtask.title = title;
    if (description !== undefined) subtask.description = description;
    if (isCompleted !== undefined) {
        subtask.isCompleted = isCompleted === true || isCompleted === "true";
    }

    await subtask.save();

    return res
        .status(200)
        .json(new ApiResponse(200, subtask, "Subtask updated successfully"));
});

const deleteSubTask = asyncHandler(async (req, res) => {
    const { projectId, subTaskId } = req.params;

    if (
        !mongoose.isValidObjectId(projectId) ||
        !mongoose.isValidObjectId(subTaskId)
    ) {
        throw new ApiError(400, "Invalid Project Id or SubTask Id");
    }

    const subtask = await SubTask.findById(subTaskId).populate(
        "task",
        "project",
    );

    if (!subtask || !subtask.task) {
        throw new ApiError(404, "SubTask not found");
    }

    if (subtask.task.project.toString() !== projectId) {
        throw new ApiError(404, "SubTask not found in this project");
    }

    await SubTask.findByIdAndDelete(subTaskId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "SubTask deleted successfully"));
});

export {
    getTasks,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    createSubTask,
    updateSubTask,
    deleteSubTask,
};
