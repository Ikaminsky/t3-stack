import { type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import React from "react";
import { api } from "@/utils/api";
import { PageLayout } from "@/components/layout";
import Image from "next/image";
import { LoadingPage } from "@/components/loading";
import { PostView } from "@/components/postView";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";

const ProfileFeed = ({ userId }: { userId: string }) => {
  const { data, isLoading } = api.post.getPostsByUserId.useQuery({ userId });
  if (isLoading) return <LoadingPage />;
  if (!data || data.length === 0) return <div>No posts for this user</div>;

  return (
    <div className="flex flex-col">
      {data?.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage<{ username: string }> = ({ username }) => {
  const { data } = api.profile.getUserByUsername.useQuery({
    username,
  });

  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        <div className="relative h-36 bg-slate-600">
          <Image
            src={data.profileImageUrl}
            alt={data.username ?? ""}
            width={128}
            height={128}
            className="absolute bottom-0 left-0 -mb-[48px] ml-4 rounded-full border-4 border-black bg-black"
          />
        </div>
        <div className="h-[64px]" />
        <div className="p-4 text-2xl font-bold">
          {`@${data.username ?? ""}`}
        </div>
        <div className="w-full border-b border-slate-400">
          <ProfileFeed userId={data.id} />
        </div>
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (ctx) => {
  const ssg = generateSSGHelper();

  const slug = ctx.params?.slug;
  if (typeof slug !== "string") throw new Error("No slug provided");

  const username = slug.replace("@", "").toLowerCase();

  await ssg.profile.getUserByUsername.prefetch({ username });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      username,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};
export default Home;
