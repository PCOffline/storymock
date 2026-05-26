/**
 * Story Composition
 *
 * Demonstrates how stories compose schemas into coherent datasets:
 * - `.add()` / `.addMany()` with type accumulation
 * - `ref()` for foreign keys (scalar and array)
 * - `ref()` with explicit field access
 * - `.setup()` for complex relationship wiring
 * - Inline overrides with `ref()`
 */

import { bool, lorem, person, ref, schema, story, text } from 'storymock';

// --- Minimal domain interfaces ---

interface Author {
  id: string;
  name: string;
  posts: Post[];
}

interface Post {
  id: string;
  authorId: string;
  title: string;
  published: boolean;
}

interface Comment {
  id: string;
  postId: string; // scalar — references ONE post
  authorId: string;
  body: string;
}

interface Playlist {
  id: string;
  name: string;
  postIds: string[]; // array — references ALL posts
}

// --- Schema definitions ---

const AuthorSchema = schema<Author>({
  id: text().uuid(),
  name: person().fullName(),
  posts: [],
});

const PostSchema = schema<Post>({
  id: text().uuid(),
  authorId: '',
  title: lorem().sentence(),
  published: bool(),
});

const CommentSchema = schema<Comment>({
  id: text().uuid(),
  postId: '',
  authorId: '',
  body: lorem().sentence(),
});

const PlaylistSchema = schema<Playlist>({
  id: text().uuid(),
  name: lorem().sentence(),
  postIds: [],
});

// --- Story composition ---

// Type accumulates with each .add() / .addMany():
//   story()                                → Story<{}>
//   .add('author', ...)                    → Story<{ author: Author }>
//   .addMany('posts', ..., 3, ...)         → Story<{ author: Author; posts: Post[] }>
//   .add('comment', ...)                   → Story<{ author: Author; posts: Post[]; comment: Comment }>

// ⚠️ ref() on an addMany entry resolves to string[] (array of IDs).
// For scalar fields like comment.postId, use .setup() to pick one:

const blogStory = story()
  .add('author', AuthorSchema)
  .addMany('posts', PostSchema, 3, { authorId: ref('author') })
  .add('playlist', PlaylistSchema, { postIds: ref('posts') }) // ✅ array field ← array ref
  .add('comment', CommentSchema, { authorId: ref('author') })
  .setup((m) => {
    // Wire author.posts — array membership requires .setup()
    m.author.posts = m.posts;
    // Wire comment to a specific post — scalar field needs .setup(), not ref()
    m.comment.postId = m.posts[0].id;
  });

const result = blogStory.create();

// result.posts[0].authorId === result.author.id   ✓  (ref scalar)
// result.playlist.postIds  === [post IDs array]   ✓  (ref on addMany → array field)
// result.comment.authorId  === result.author.id   ✓  (ref scalar)
// result.comment.postId    === result.posts[0].id ✓  (setup wiring)
// result.author.posts      === result.posts       ✓  (setup wiring)

// --- ref() with explicit field ---

// ref('author', 'name') demonstrates explicit field access —
// in practice you'd use a properly-named field
const attributedComment = story()
  .add('author', AuthorSchema)
  .add('post', PostSchema, { authorId: ref('author') })
  .add('comment', CommentSchema, {
    authorId: ref('author', 'name'), // resolves to author.name instead of author.id
    postId: ref('post'),
  })
  .create();

// attributedComment.comment.authorId === attributedComment.author.name  ✓
