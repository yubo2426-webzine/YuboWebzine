import { CreateDemoUserData, ListArticlesData, CreateCommentData, CreateCommentVariables, MySubscriptionTypesData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useCreateDemoUser(options?: useDataConnectMutationOptions<CreateDemoUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateDemoUserData, undefined>;
export function useCreateDemoUser(dc: DataConnect, options?: useDataConnectMutationOptions<CreateDemoUserData, FirebaseError, void>): UseDataConnectMutationResult<CreateDemoUserData, undefined>;

export function useListArticles(options?: useDataConnectQueryOptions<ListArticlesData>): UseDataConnectQueryResult<ListArticlesData, undefined>;
export function useListArticles(dc: DataConnect, options?: useDataConnectQueryOptions<ListArticlesData>): UseDataConnectQueryResult<ListArticlesData, undefined>;

export function useCreateComment(options?: useDataConnectMutationOptions<CreateCommentData, FirebaseError, CreateCommentVariables>): UseDataConnectMutationResult<CreateCommentData, CreateCommentVariables>;
export function useCreateComment(dc: DataConnect, options?: useDataConnectMutationOptions<CreateCommentData, FirebaseError, CreateCommentVariables>): UseDataConnectMutationResult<CreateCommentData, CreateCommentVariables>;

export function useMySubscriptionTypes(options?: useDataConnectQueryOptions<MySubscriptionTypesData>): UseDataConnectQueryResult<MySubscriptionTypesData, undefined>;
export function useMySubscriptionTypes(dc: DataConnect, options?: useDataConnectQueryOptions<MySubscriptionTypesData>): UseDataConnectQueryResult<MySubscriptionTypesData, undefined>;
