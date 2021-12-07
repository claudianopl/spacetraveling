/* eslint-disable react/no-danger */
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';
import { formatDate } from '../../utils/formatDate';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const route = useRouter();

  if (route.isFallback) {
    return <p>Carregando...</p>;
  }

  const totalTime = post.data.content.reduce((acc, time) => {
    const total = RichText.asText(time.body).split(' ');

    const min = Math.ceil(total.length / 200);
    return acc + min;
  }, 0);

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <div className={styles.wrapperHeader}>
        <Header />
      </div>
      <article className={styles.wrapper}>
        <div className={styles.containerBanner}>
          <img
            className={styles.banner}
            src={post.data.banner.url}
            alt="banner"
          />
        </div>

        <div className={styles.containerPost}>
          <h1>{post.data.title}</h1>
          <div className={styles.datePost}>
            <div className={styles.date}>
              <time>
                <FiCalendar />
                {formatDate(post.first_publication_date)}
              </time>
            </div>
            <div className={styles.author}>
              <FiUser />
              <p>{post.data.author}</p>
            </div>
            <div>
              <FiClock />
              <p>{totalTime} min</p>
            </div>
          </div>
        </div>

        <section className={styles.postContent}>
          {post.data.content.map(p => (
            <div key={p.heading}>
              <strong>{p.heading}</strong>
              <div
                dangerouslySetInnerHTML={{ __html: RichText.asHtml(p.body) }}
              />
            </div>
          ))}
        </section>
      </article>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(Prismic.predicates.at['type.posts']);

  const paths = posts.results.map(post => {
    return {
      params: { slug: post.uid },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      ...response.data,
    },
  };
  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // 30 minutes
  };
};
