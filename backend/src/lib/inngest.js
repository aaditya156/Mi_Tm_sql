import { Inngest } from "inngest";
import prisma from "./db.js";
import { deleteStreamUser, upsertStreamUser } from "./stream.js";

export const inngest = new Inngest({ id: "mi-time" });

const syncUser = inngest.createFunction(
  { id: "sync-user" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, email_addresses, first_name, last_name, image_url } = event.data;

    const newUser = {
      clerkId: id,
      email: email_addresses[0]?.email_address || "",
      name: `${first_name || ""} ${last_name || ""}`.trim() || "User",
      profileImage: image_url || "",
    };

    await prisma.user.upsert({
      where: { clerkId: newUser.clerkId },
      update: newUser,
      create: newUser,
    });

    await upsertStreamUser({
      id: newUser.clerkId.toString(),
      name: newUser.name,
      image: newUser.profileImage,
    });
  }
);

const deleteUserFromDB = inngest.createFunction(
  { id: "delete-user-from-db" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;
    await prisma.user.deleteMany({
      where: { clerkId: id },
    });

    await deleteStreamUser(id.toString());
  }
);

export const functions = [syncUser, deleteUserFromDB];
