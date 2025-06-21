import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";
import { sendContentWithMail } from "../utils/send_mail_utils";

export type UserType = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  isDelete: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
};

const userSchema = new mongoose.Schema<UserType>({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isDelete: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deletedAt: { type: Date },
});

// Pre-save hook: Send the plain text password to the user via email before hashing it.
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const plainPassword = this.password;

    try {
      await sendContentWithMail({
        email: this.email,
        subject: "Your Account Password",
        message: `Hello ${this.firstName},\n\nYour password is: ${plainPassword}\n\nPlease keep it safe.`,
      });
    } catch (error) {
      console.error("Error sending password email:", error);
      // Optionally, uncomment the following line to block saving if email fails:
      // return next(error);
    }

    // Hash the password after sending the email
    this.password = await bcrypt.hash(plainPassword, 8);
  }
  next();
});

// Pre "findOneAndUpdate" hook: Update the updatedAt field.
userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate() as Partial<UserType>;

  if (update.password) {
    try {
      // If the password is an empty string, don't process it
      if (update.password.trim() === "") {
        delete update.password; // Remove the password field if it's empty
        return next();
      }
      // Fetch existing user
      const user = await mongoose
        .model<UserType>("User")
        .findOne(this.getQuery());

      if (user) {
        // 🔹 Check if the password is actually changing
        const isSamePassword = await bcrypt.compare(
          update.password,
          user.password
        );
        if (!isSamePassword) {
          // 🔹 Only send mail & hash if it's a real change
          await sendContentWithMail({
            email: user.email,
            subject: "Your Updated Account Password",
            message: `Hello ${user.firstName},\n\nYour new password is: ${update.password}\n\nPlease keep it safe.`,
          });

          // Hash the new password since it's different
          update.password = await bcrypt.hash(update.password, 8);
          this.setUpdate(update);
        } else {
          // If the password is the same, we should not include it for hashing again.
          delete update.password; // Remove password field from update object if no change
        }
      }
    } catch (error) {
      console.error("Error sending password email:", error);
    }
  }

  this.set({ updatedAt: new Date() });
  next();
});

// Create a compound index on email and username.
userSchema.index({ email: 1, username: 1 }, { unique: true });

const User = mongoose.model<UserType>("User", userSchema);

export default User;
