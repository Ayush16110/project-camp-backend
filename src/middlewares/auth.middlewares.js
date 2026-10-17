import mongoose from "mongoose";
import { ProjectMember } from "../models/projectmember.models.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/async-handler.js";
import jwt from "jsonwebtoken";
import { UserRolesEnum, ProjectMemberRoleEnum } from "../utils/constants.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    const token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
        throw new ApiError(401, "Unauthorized Request");
    }

    let decodedToken;

    try {
        decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch {
        throw new ApiError(401, "Invalid or expired access token");
    }

    const user = await User.findById(decodedToken?._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationTokenExpiry",
    );

    if (!user) {
        throw new ApiError(401, "Unauthorized Request");
    }

    req.user = user;
    next();
});
export const validateProjectPermission = (roles = []) =>
    asyncHandler(async (req, res, next) => {
        if (!req.user) {
            throw new ApiError(401, "Unauthorized Request");
        }

        if (req.user.role === UserRolesEnum.ADMIN) {
            return next();
        }

        const { projectId } = req.params;

        if (!projectId || !mongoose.isValidObjectId(projectId)) {
            throw new ApiError(400, "Invalid or missing Project Id");
        }

        const membership = await ProjectMember.findOne({
            user: req.user._id,
            project: projectId,
        }).select("role");

        if (!membership) {
            throw new ApiError(404, "Project Not Found");
        }

        if (!roles.includes(membership.role)) {
            throw new ApiError(
                403,
                "You do not have permission to do this action",
            );
        }

        next();
    });
