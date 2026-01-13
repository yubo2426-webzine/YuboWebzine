import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface ArticleCategory_Key {
  articleId: UUIDString;
  categoryId: UUIDString;
  __typename?: 'ArticleCategory_Key';
}

export interface Article_Key {
  id: UUIDString;
  __typename?: 'Article_Key';
}

export interface Category_Key {
  id: UUIDString;
  __typename?: 'Category_Key';
}

export interface Comment_Key {
  id: UUIDString;
  __typename?: 'Comment_Key';
}

export interface CreateCommentData {
  comment_insert: Comment_Key;
}

export interface CreateCommentVariables {
  articleId: UUIDString;
  content: string;
}

export interface CreateDemoUserData {
  user_insert: User_Key;
}

export interface ListArticlesData {
  articles: ({
    id: UUIDString;
    title: string;
    content: string;
    publishedAt: TimestampString;
    author?: {
      id: UUIDString;
      displayName: string;
    } & User_Key;
  } & Article_Key)[];
}

export interface MySubscriptionTypesData {
  subscriptionTypes: ({
    id: UUIDString;
    type: string;
    targetId: UUIDString;
  } & SubscriptionType_Key)[];
}

export interface SubscriptionType_Key {
  id: UUIDString;
  __typename?: 'SubscriptionType_Key';
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface CreateDemoUserRef {
  /* Allow users to create refs without passing in DataConnect */
  (): MutationRef<CreateDemoUserData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): MutationRef<CreateDemoUserData, undefined>;
  operationName: string;
}
export const createDemoUserRef: CreateDemoUserRef;

export function createDemoUser(): MutationPromise<CreateDemoUserData, undefined>;
export function createDemoUser(dc: DataConnect): MutationPromise<CreateDemoUserData, undefined>;

interface ListArticlesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListArticlesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<ListArticlesData, undefined>;
  operationName: string;
}
export const listArticlesRef: ListArticlesRef;

export function listArticles(): QueryPromise<ListArticlesData, undefined>;
export function listArticles(dc: DataConnect): QueryPromise<ListArticlesData, undefined>;

interface CreateCommentRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateCommentVariables): MutationRef<CreateCommentData, CreateCommentVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: CreateCommentVariables): MutationRef<CreateCommentData, CreateCommentVariables>;
  operationName: string;
}
export const createCommentRef: CreateCommentRef;

export function createComment(vars: CreateCommentVariables): MutationPromise<CreateCommentData, CreateCommentVariables>;
export function createComment(dc: DataConnect, vars: CreateCommentVariables): MutationPromise<CreateCommentData, CreateCommentVariables>;

interface MySubscriptionTypesRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<MySubscriptionTypesData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<MySubscriptionTypesData, undefined>;
  operationName: string;
}
export const mySubscriptionTypesRef: MySubscriptionTypesRef;

export function mySubscriptionTypes(): QueryPromise<MySubscriptionTypesData, undefined>;
export function mySubscriptionTypes(dc: DataConnect): QueryPromise<MySubscriptionTypesData, undefined>;

