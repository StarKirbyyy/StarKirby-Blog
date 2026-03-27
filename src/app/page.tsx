import type { Metadata } from "next";
import { HomeHero } from "@/components/home/HomeHero";
import { HomePostThumbCard } from "@/components/home/HomePostThumbCard";
import { siteConfig } from "@/config/site";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "首页",
  description: siteConfig.description,
  alternates: {
    canonical: "/",
  },
};

export const revalidate = 3600;

export default async function HomePage() {
  const posts = await getAllPosts();

  return (
    <div className="home-azifan">
      <HomeHero
        title={siteConfig.title}
        subtitle={siteConfig.description}
        postsCount={posts.length}
      />

      <div id="page" className="site wrapper">
        <div className="blank" />
        <div id="content" className="site-content">
          <div id="primary" className="content-area">
            <main id="main" className="site-main" role="main">
              <h1 id="home-latest" className="main-title posts-area-title scroll-mt-20">
                <span className="posts-area-icon">◉</span>
                <span>Article</span>
              </h1>

              {posts.length === 0 ? (
                <section className="glass-panel rounded-[10px] p-7 text-center">
                  <p className="text-sm text-muted-fg">还没有发布文章。</p>
                </section>
              ) : (
                <>
                  {posts.map((post) => (
                    <HomePostThumbCard key={post.slug} post={post} />
                  ))}
                </>
              )}
            </main>
            <div id="pagination" />
          </div>
        </div>
      </div>
    </div>
  );
}
