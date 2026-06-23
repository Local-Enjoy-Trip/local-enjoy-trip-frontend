import { apiDelete, apiGet, apiPost } from "@/shared/api/http";

export type FriendshipStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "DELETED";

export type Friend = {
  displayName: string;
  email?: string | null;
  friendshipId: number;
  userId: string;
};

export type MemberSearchResult = {
  email: string;
  name: string;
  nickname?: string | null;
  profileImageUrl?: string | null;
  userId: string;
};

export type Friendship = {
  addresseeDisplayName: string;
  addresseeEmail?: string | null;
  addresseeUserId: string;
  id: number;
  requestedAt: string;
  requesterDisplayName: string;
  requesterEmail?: string | null;
  requesterUserId: string;
  respondedAt?: string | null;
  status: FriendshipStatus;
};

type FriendsResponse = {
  friends: Friend[];
};

type FriendshipRequestsResponse = {
  requests: Friendship[];
};

type FriendshipMutationResponse = {
  friendship: Friendship;
};

type MembersResponse = {
  users: MemberSearchResult[];
};

export const friendsQueryKey = ["friends"] as const;
export const memberSearchQueryKey = ["members", "search"] as const;
export const receivedFriendRequestsQueryKey = ["friends", "requests", "received"] as const;
export const sentFriendRequestsQueryKey = ["friends", "requests", "sent"] as const;

export function getMembers() {
  return apiGet<MembersResponse>("/api/members").then(
    (response) => response.users,
  );
}

export function getFriends() {
  return apiGet<FriendsResponse>("/api/friendships").then(
    (response) => response.friends,
  );
}

export function getReceivedFriendRequests() {
  return apiGet<FriendshipRequestsResponse>(
    "/api/friendships/requests/received",
  ).then((response) => response.requests);
}

export function getSentFriendRequests() {
  return apiGet<FriendshipRequestsResponse>(
    "/api/friendships/requests/sent",
  ).then((response) => response.requests);
}

export function requestFriendship(targetUserId: string) {
  return apiPost<FriendshipMutationResponse>("/api/friendships/requests", {
    targetUserId,
  });
}

export function acceptFriendshipRequest(friendshipId: number) {
  return apiPost<FriendshipMutationResponse>(
    `/api/friendships/requests/${friendshipId}/accept`,
  );
}

export function rejectFriendshipRequest(friendshipId: number) {
  return apiPost<FriendshipMutationResponse>(
    `/api/friendships/requests/${friendshipId}/reject`,
  );
}

export function cancelFriendshipRequest(friendshipId: number) {
  return apiDelete<FriendshipMutationResponse>(
    `/api/friendships/requests/${friendshipId}`,
  );
}

export function deleteFriendship(friendshipId: number) {
  return apiDelete<FriendshipMutationResponse>(
    `/api/friendships/${friendshipId}`,
  );
}
