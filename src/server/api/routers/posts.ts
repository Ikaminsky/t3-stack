import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure
} from "@/server/api/trpc";
import { clerkClient } from "@clerk/nextjs/api";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { filterUserForTheClient } from "@/server/helpers/filterUser";
import type { Post } from ".prisma/client";

const rateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true
});

const addUserDataToPosts = async (posts: Post[]) => {
  const users = (
    await clerkClient.users.getUserList({
      userId: posts.map((p) => p.authorId),
      limit: 100
    })
  ).map(filterUserForTheClient);

  return posts.map((post) => {
    const author = users.find((u) => u.id === post.authorId);

    if (!author || !author.username)
      throw new TRPCError({
        message: "No author provided",
        code: "INTERNAL_SERVER_ERROR"
      });

    return {
      post,
      author: {
        ...author,
        username: author.username
      }
    };
  });
};

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }]
    });

    return addUserDataToPosts(posts);
  }),
  create: privateProcedure
    .input(
      z.object({
        content: z.string().emoji("Only emojis possible!").min(1).max(280)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const authorId = ctx.userId;
      const { success } = await rateLimit.limit(authorId);
      if (!success) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS" });
      }
      const post = await ctx.prisma.post.create({
        data: {
          authorId,
          content: input.content
        }
      });

      return post;
    }),
  getPostsByUserId: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userPosts = await ctx.prisma.post.findMany({
        where: {
          authorId: input.userId
        },
        take: 100,
        orderBy: [{ createdAt: "desc" }]
      });

      return addUserDataToPosts(userPosts);
    }),
  getPostById: publicProcedure
    .input(z.object({ postId: z.string() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.findUnique({ where: { id: input.postId } });

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return (await addUserDataToPosts([post]))[0];
    })
});
