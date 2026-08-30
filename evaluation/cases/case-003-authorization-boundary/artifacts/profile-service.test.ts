import { describe, expect, it, vi } from "vitest";

import {
    ProfileService,
    type ProfileRepository
} from "./profile-service.js";

function createRepository(): ProfileRepository {
    return {
        findById: vi.fn().mockResolvedValue({
            id: "profile-001",
            ownerId: "user-001",
            displayName: "Old Name"
        }),

        update: vi.fn().mockResolvedValue({
            id: "profile-001",
            ownerId: "user-001",
            displayName: "New Name"
        })
    };
}

describe("ProfileService", () => {
    it("updates an existing profile", async () => {
        const repository = createRepository();

        const service = new ProfileService(
            repository
        );

        const result = await service.updateProfile({
            authenticatedUserId: "user-001",
            profileId: "profile-001",
            displayName: "New Name"
        });

        expect(result.displayName).toBe(
            "New Name"
        );

        expect(
            repository.findById
        ).toHaveBeenCalledWith(
            "profile-001"
        );

        expect(
            repository.update
        ).toHaveBeenCalledWith(
            "profile-001",
            {
                displayName: "New Name"
            }
        );
    });

    it("rejects a missing authenticated user ID", async () => {
        const repository = createRepository();

        const service = new ProfileService(
            repository
        );

        await expect(
            service.updateProfile({
                authenticatedUserId: " ",
                profileId: "profile-001",
                displayName: "New Name"
            })
        ).rejects.toThrow(
            "Authenticated user ID is required"
        );
    });

    it("rejects a missing profile ID", async () => {
        const repository = createRepository();

        const service = new ProfileService(
            repository
        );

        await expect(
            service.updateProfile({
                authenticatedUserId: "user-001",
                profileId: " ",
                displayName: "New Name"
            })
        ).rejects.toThrow(
            "Profile ID is required"
        );
    });

    it("rejects an empty display name", async () => {
        const repository = createRepository();

        const service = new ProfileService(
            repository
        );

        await expect(
            service.updateProfile({
                authenticatedUserId: "user-001",
                profileId: "profile-001",
                displayName: " "
            })
        ).rejects.toThrow(
            "Display name is required"
        );
    });

    it("rejects a missing profile", async () => {
        const repository = createRepository();

        repository.findById = vi
            .fn()
            .mockResolvedValue(null);

        const service = new ProfileService(
            repository
        );

        await expect(
            service.updateProfile({
                authenticatedUserId: "user-001",
                profileId: "missing-profile",
                displayName: "New Name"
            })
        ).rejects.toThrow(
            "Profile not found"
        );
    });
});