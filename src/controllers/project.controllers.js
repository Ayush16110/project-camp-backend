import { User } from "../models/user.models.js";
import { Project } from "../models/project.models.js";
import { ProjectMember } from "../models/projectmember.models.js";
import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import mongoose, { Mongoose } from "mongoose";
import {
    AvailableTaskStatus,
    AvailableUserRole,
    UserRoleEnum,
} from "../utils/constants.js";

const getProjects = asyncHandler(async (req, res) => {
    const projects = await ProjectMember.aggregate([
        {
            $match: {
                user: new mongoose.Types.ObjectId(req.user._id),
            },
        },
        {
            $lookup: {
                from: "projects",
                localField: "project", 
                foreignField: "_id",
                as: "projectDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "projectmembers",
                            localField: "_id",
                            foreignField: "project",
                            as: "projectmembers",
                        },
                    },
                    {
                        $addFields: {
                            membersCount: { $size: "$projectmembers" },
                        },
                    },
                ],
            },
        },
        {
            $unwind: "$projectDetails",
        },
        {
            $project: {
                _id: "$projectDetails._id",
                name: "$projectDetails.name",
                description: "$projectDetails.description",
                createdAt: "$projectDetails.createdAt",
                createdBy: "$projectDetails.createdBy",
                membersCount: "$projectDetails.membersCount",
                role: 1, // Role from ProjectMember
            },
        },
    ]);

    // Fixed the empty check for arrays
    if (!projects || projects.length === 0) {
        throw new ApiError(404, "No projects found for this user");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, projects, "Projects fetched successfully"));
});

const getProjectById = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const projectMember = await ProjectMember.find({
        user: new mongoose.Types.ObjectId(req.user._id),
        project: new mongoose.Types.ObjectId(projectId),
    });

    if (!projectMember) {
        throw new ApiError(403, "Unauthorized access");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, project, "Project fetched successfully"));
});

const createProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    const project = await Project.create({
        name,
        description,
        createdBy: new mongoose.Types.ObjectId(req.user._id),
    });

    if (!project) {
        throw new ApiError(400, "Something went wrong");
    }

    await ProjectMember.create({
        user: new mongoose.Types.ObjectId(req.user._id),
        project: new mongoose.Types.ObjectId(project._id),
        role: UserRoleEnum.PROJECT_ADMIN,
    });

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                { project: project },
                "Project created successfully",
            ),
        );
});

const updateProject = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    const { projectId } = req.params;

    const project = await Project.findByIdAndUpdate(
        projectId,
        {
            name,
            description,
        },
        { new: true, runValidators: true },
    );

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { project: project },
                "Project updated successfully",
            ),
        );
});

const deleteProject = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found!");
    }

    await Project.deleteOne({ _id: projectId });

    await ProjectMember.deleteMany({ project: projectId });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Porject deleted successfully"));
});

const getProjectMembers = asyncHandler(async (req, res) => {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);

    if (!project) {
        throw new ApiError(404, "Project not found");
    }

    const projectMembers = await ProjectMember.aggregate([
        {
            $match: {
                project: new mongoose.Types.ObjectId(projectId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "user",
                foreignField: "_id",
                as: "userFetched",
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
            },
        },
        {
            $addFields: {
                user: {
                    $arrayElemAt: ["$userFetched", 0],
                },
            },
        },
        {
            $project: {
                project: 1,
                user: 1,
                role: 1,
                createdAt: 1,
                updatedAt: 1,
                _id: 0,
            },
        },
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, projectMembers, "Project members fetched"));
});

const addMembersToProject = asyncHandler(async (req, res) => {
    const { email, role } = req.body;
    const { projectId } = req.params;

    const projectMember = await ProjectMember.findByIdAndUpdate(
        {
            user: new mongoose.Types.ObjectId(req.user._id),
            project: new mongoose.Types.ObjectId(projectId),
        },
        {
            user: new mongoose.Types.ObjectId(req.user._id),
            project: new mongoose.Types.ObjectId(projectId),
            role: role,
        },
        {
            upsert: true,
            new: true,
        },
    );

    if (!projectMember) {
        throw new ApiError(400, "Something went wrong");
    }

    return res
        .status(200)
        .json(new ApiResponse(201, {}, "Project member added successfully"));
});

const updateMemberRole = asyncHandler(async (req, res) => {
    const { projectId, userId } = req.params;
    const { newRole } = req.body;

    if (!AvailableUserRole.includes(newRole)) {
        throw new ApiError(400, "Invalid Role");
    }

    let projectMember = await ProjectMember.findOne({
        user: new mongoose.Types.ObjectId(userId),
        project: new mongoose.Types.ObjectId(projectId),
    });

    if (!projectMember) {
        throw new ApiError(404, "Project Member not found");
    }

    projectMember = await ProjectMember.findByIdAndUpdate(
        projectMember._id,
        {
            role: newRole,
        },
        { new: true },
    );

    if (!projectMember) {
        throw new ApiError(404, "Project Member not found");
    }

    res.status(200).json(
        new ApiResponse(
            200,
            projectMember,
            "Project member role updated successfully",
        ),
    );
});

const deleteMember = asyncHandler(async (req, res) => {
    const { userId, projectId } = req.params;

    const projectMember = await ProjectMember.findOne({
        user: new mongoose.Types.ObjectId(userId),
        project: new mongoose.Types.ObjectId(projectId),
    });

    if (!projectMember) {
        throw new ApiError(404, "Project member not found");
    }

    await ProjectMember.findByIdAndDelete(projectMember._id);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Project Member removed successfully"));
});

export {
    getProjectById,
    getProjects,
    createProject,
    updateProject,
    deleteProject,
    getProjectMembers,
    addMembersToProject,
    updateMemberRole,
    deleteMember,
};
