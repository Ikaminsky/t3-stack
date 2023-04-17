import Image from "next/image";
import Link from "next/link";
import dayjs from "dayjs";
import React from "react";
import type { RouterOutputs } from "@/utils/api";
import relativeTime from "dayjs/plugin/relativeTime";

type PostWithUser = RouterOutputs["post"]["getAll"][number];

dayjs.extend(relativeTime);

export const PostView = ({ post, author }: PostWithUser) => {
  return (
    <div key={post.id} className="flex gap-3 border-b border-slate-400 p-8">
      <Image
        src={author.profileImageUrl}
        alt={author.username ?? ""}
        className="h-14 w-14 rounded-full"
        width={56}
        height={56}
      />
      <div className="flex flex-col">
        <div className="flex gap-1 text-slate-300">
          <Link href={`/@${author.username}`}>
            <span>{`@${author.username}`}</span>
          </Link>
          <Link href={`/post/${post.id}`}>
            <span className="whitespace-pre font-thin">{`  · ${dayjs(
              post.createdAt
            ).fromNow()}`}</span>
          </Link>
        </div>
        <span>{post.content}</span>
      </div>
    </div>
  );
};
