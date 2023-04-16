import { type NextPage } from "next";
import Head from "next/head";

import { api, type RouterOutputs } from "@/utils/api";
import { SignInButton, useUser } from "@clerk/nextjs";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { Loading, LoadingPage } from "@/components/loading";
import React, { useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const [input, setInput] = useState<string>("");
  const ctx = api.useContext();
  const { user } = useUser();
  const { mutate: createPost, isLoading: isPosting } =
    api.post.create.useMutation({
      onSuccess: () => {
        setInput("");
        void ctx.post.getAll.invalidate();
      },
      onError: (e) => {
        const errorMessage = e.data?.zodError?.fieldErrors.content;
        if (errorMessage && errorMessage[0]) {
          toast.error(errorMessage[0]);
        } else {
          toast.error("Failed to post. Try again later.");
        }
      },
    });

  if (!user) return null;

  return (
    <div className="flex w-full gap-3">
      <Image
        src={user.profileImageUrl}
        alt="User avatar"
        className="h-14 w-14 rounded-full"
        width={56}
        height={56}
      />
      <input
        type="text"
        placeholder="Type some emojis!"
        className="grow bg-transparent outline-none"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={isPosting}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input !== "") {
              createPost({ content: input });
            }
          }
        }}
      />
      {input !== "" && (
        <button
          onClick={() => createPost({ content: input })}
          disabled={isPosting}
        >
          Post
        </button>
      )}
      {isPosting && (
        <div className="flex flex-col items-center justify-center">
          <Loading size={20} />
        </div>
      )}
    </div>
  );
};

type PostWithUser = RouterOutputs["post"]["getAll"][number];
const PostView = ({ post, author }: PostWithUser) => {
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
          <Link href={`/@${author.username}`}><span>{`@${author.username}`}</span></Link>
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

const Feed = () => {
  const { data, isLoading: isPostsLoading } = api.post.getAll.useQuery();

  if (isPostsLoading) return <LoadingPage />;
  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex flex-col">
      {data?.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { isLoaded: isUserLoading, isSignedIn } = useUser();

  // To get the fresh cached data
  api.post.getAll.useQuery();

  if (!isUserLoading) return <div />;

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen justify-center">
        <div className="h-full w-full border-x border-slate-200 md:max-w-2xl">
          <div className="justify-center border-b border-slate-200 p-4">
            {!isSignedIn && (
              <div className="flex justify-center">
                <SignInButton />
              </div>
            )}
            {isSignedIn && <CreatePostWizard />}
          </div>
          <Feed />
        </div>
      </main>
    </>
  );
};

export default Home;
