import { type GetStaticProps, type NextPage } from "next";
import Head from "next/head";
import React from "react";
import { api } from "@/utils/api";
import { PageLayout } from "@/components/layout";
import { generateSSGHelper } from "@/server/helpers/ssgHelper";
import { PostView } from "@/components/postView";

const PostPage: NextPage<{ postId: string }> = ({ postId }) => {
  const { data } = api.post.getPostById.useQuery({ postId })

  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{`${data.post.content} - ${data.author.username}`}</title>
      </Head>
      <PageLayout>
        <PostView {...data} />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (ctx) => {
  const ssg = generateSSGHelper();

  const postId = ctx.params?.id;

  if (typeof postId !== "string") throw new Error("No id provided");

  await ssg.post.getPostById.prefetch({ postId });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      postId,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};
export default PostPage;

