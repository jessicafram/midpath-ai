export interface UpdateProfileInput {
    authenticatedUserId: string;
    profileId: string;
    displayName: string;
}

export interface Profile {
    id: string;
    ownerId: string;
    displayName: string;
}

export interface ProfileRepository {
    findById(profileId: string): Promise<Profile | null>;

    update(
        profileId: string,
        input: {
            displayName: string;
        }
    ): Promise<Profile>;
}

export class ProfileService {
    constructor(
        private readonly profileRepository: ProfileRepository
    ) { }

    async updateProfile(
        input: UpdateProfileInput
    ): Promise<Profile> {
        if (!input.authenticatedUserId.trim()) {
            throw new Error(
                "Authenticated user ID is required"
            );
        }

        if (!input.profileId.trim()) {
            throw new Error(
                "Profile ID is required"
            );
        }

        if (!input.displayName.trim()) {
            throw new Error(
                "Display name is required"
            );
        }

        const profile =
            await this.profileRepository.findById(
                input.profileId
            );

        if (!profile) {
            throw new Error(
                "Profile not found"
            );
        }

        return this.profileRepository.update(
            profile.id,
            {
                displayName: input.displayName.trim()
            }
        );
    }
}