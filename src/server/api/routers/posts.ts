import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { clerkClient, type User } from "@clerk/nextjs/api";
import { TRPCError } from "@trpc/server";

const filterUserForTheClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  };
};
export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({ take: 100 });
    const users = (
      await clerkClient.users.getUserList({
        userId: posts.map((p) => p.authorId),
        limit: 100,
      })
    ).map(filterUserForTheClient);

    return posts.map((post) => {
      const author = users.find((u) => u.id === post.authorId);

      if (!author || !author.username)
        throw new TRPCError({
          message: "No author provided",
          code: "INTERNAL_SERVER_ERROR",
        });

      return {
        post,
        author: {
          ...author,
          username: author.username,
        },
      };
    });
  }),
});
