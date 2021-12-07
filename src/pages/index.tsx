import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { useCallback, useEffect, useState } from 'react';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [posts, setPosts] = useState([]);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  const handleLoadMore = useCallback(async () => {
    const prismic = getPrismicClient();
    const postsResponse = await fetch(nextPage)
      .then(response => response.json())
      .then(data => {
        setNextPage(data.next_page);
        return data.results;
      })
      .catch(err => {
        console.error(err);
      });

    const results = postsResponse.map(post => {
      return {
        uid: post.uid,
        first_publication_date: post.first_publication_date,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });

    setPosts(currentPosts => [...currentPosts, ...results]);
  }, [nextPage]);

  useEffect(() => {
    setPosts(postsPagination.results);
  }, [postsPagination]);

  return (
    <>
      <Head>
        <title>Home</title>
      </Head>
      <div className={styles.wrapper}>
        <Header />

        <main className={styles.container}>
          <div className={styles.paper}>
            {posts.map(post => (
              <Link key={post.uid} href={`/post/${post.uid}`}>
                <div className={styles.post}>
                  <span>{post.data.title}</span>
                  <p className={styles.subtitle}>{post.data.subtitle}</p>

                  <div className={styles.datePost}>
                    <div className={styles.date}>
                      <time>
                        <FiCalendar />
                        {format(
                          new Date(post.first_publication_date),
                          'dd MMM yyyy',
                          {
                            locale: ptBR,
                          }
                        )}
                      </time>
                    </div>
                    <div className={styles.author}>
                      <FiUser />
                      <p>{post.data.author}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {nextPage && (
              <button type="button" onClick={handleLoadMore}>
                Carregar mais posts
              </button>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.author', 'posts.subtitle'],
    }
  );

  const posts = postsResponse.results.map(post => ({
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: post.data,
  }));

  return {
    props: {
      postsPagination: {
        results: posts,
        next_page: postsResponse.next_page,
      },
    },
    revalidate: 60 * 30, // 30 minutos
  };
};
