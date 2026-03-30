export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  invite_code: string;
  created_at: string;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
  created_at: string;
};

export type Reaction = {
  id: string;
  availability_id: string;
  user_id: string;
  type: "like" | "interested";
  created_at: string;
  profile?: Profile;
};

export type Comment = {
  id: string;
  availability_id: string;
  user_id: string;
  text: string;
  created_at: string;
  profile?: Profile;
};

export type FriendTag = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  members?: { friend_user_id: string }[];
};

export type Availability = {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  message: string | null;
  visibility: "all" | "tags";
  visibility_tag_ids: string[] | null;
  created_at: string;
  // Joined
  profile?: Profile;
  reactions?: Reaction[];
  comments?: Comment[];
};

export type Hangout = {
  id: string;
  creator_id: string;
  title: string;
  location: string | null;
  start_time: string;
  end_time: string;
  max_people: number;
  created_at: string;
  // Joined
  profile?: Profile;
  participants?: HangoutParticipant[];
};

export type HangoutParticipant = {
  hangout_id: string;
  user_id: string;
  joined_at: string;
  profile?: Profile;
};
