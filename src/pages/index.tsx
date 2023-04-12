import { type NextPage } from "next";
import Head from "next/head";

import { api } from "@/utils/api";
import { SignInButton, SignOutButton, useUser } from "@clerk/nextjs";

const Home: NextPage = () => {
    const hello = api.example.hello.useQuery({ text: "from tRPC" });
  const { data } = api.post.getAll.useQuery();
  const user = useUser();
  console.log(data, hello);

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div>
          {user.isSignedIn && <SignOutButton />}
          {!user.isSignedIn && <SignInButton />}
        </div>
        <div>
          {data?.map((post) => (
            <div key={post.id}>{post.content}</div>
          ))}
        </div>
      </main>
    </>
  );
};

export default Home;
