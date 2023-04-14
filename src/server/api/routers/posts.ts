import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { clerkClient, type User } from "@clerk/nextjs/api";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const filterUserForTheClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    profileImageUrl: user.profileImageUrl,
  };
};
export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }],
    });
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
  create: privateProcedure
    .input(z.object({ content: z.string().emoji().min(1).max(280) }))
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;

      const post = await ctx.prisma.post.create({
        data: {
          authorId,
          content: input.content,
        },
      });

      return post;
    }),
});
