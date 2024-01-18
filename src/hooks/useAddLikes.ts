import {
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
} from "firebase/firestore";
import React from "react";
import { db } from "../firebase/config";
import useAuthStore from "../global/authStore";

interface Props {
  likeCount: number;
  postId: string;
}

const useAddLikes = ({ likeCount, postId }: Props) => {
  const [like, setLike] = React.useState(likeCount);
  const [liked, setLiked] = React.useState(false);
  const { userName, userId, photoURL } = useAuthStore();

  React.useEffect(() => {
    const handleLike = async () => {
      try {
        const postDocRef = doc(db, "posts", postId);
        const docSnapshot = await getDoc(postDocRef);

        if (docSnapshot.exists()) {
          const currentLikes = docSnapshot.data()?.likes || 0;
          setLike(currentLikes);
          setLiked((liked) => liked || currentLikes > 0); // Set liked to true if currentLikes is greater than 0
        }
      } catch (error) {
        console.log(error);
      }
    };

    handleLike();
  }, [postId]);

  const addLike = async () => {
    setLiked((prev) => !prev);
    try {
      const postDocRef = doc(db, "posts", postId);
      const userDocRef = doc(db, "users", userId);

      // Check if the user document exists
      const userDocSnapshot = await getDoc(userDocRef);

      if (!userDocSnapshot.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userDocRef, {
          userId,
          userName,
          photoURL,
          likedPosts: [],
        });
      }

      // Check if the post is not in the likedPosts list
      const likedPosts = userDocSnapshot.data()?.likedPosts || [];
      if (!likedPosts.includes(postId)) {
        // Update post likes
        await updateDoc(postDocRef, { likes: like + 1 });

        // Update user's liked posts
        await updateDoc(userDocRef, {
          likedPosts: arrayUnion(postId),
        });

        setLike((prev) => prev + 1);
        setLiked(true);
      } else {
        // Update post likes
        await updateDoc(postDocRef, { likes: like - 1 });

        // Update user's liked posts
        await updateDoc(userDocRef, {
          likedPosts: arrayRemove(postId),
        });

        setLike((prev) => prev - 1);
        setLiked(false);
      }
    } catch (error) {
      console.error("Error updating like count:", error);
    }
  };
  console.log(liked);

  return { addLike, like, liked };
};

export default useAddLikes;
