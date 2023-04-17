import { User } from "@clerk/nextjs/api";

export const filterUserForTheClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  };
};
