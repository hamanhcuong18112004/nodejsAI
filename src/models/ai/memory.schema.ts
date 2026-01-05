import mongoose, { Document } from 'mongoose';
const { Schema } = mongoose;
export interface IMemory extends Document{
  userId: string;
  summary: string;
  embedding: number[];
  isDeleted: boolean;
  deletedAt: Date | null;
}
const memorySchema = new Schema({
      userId:{
        type: String,
        required: true,
        index: true 
      },
      summary:{
        type: String,
        default: ""
      },
      embedding:{
        type: [Number],
        default: []
      },
      isDeleted:{
        type: Boolean,
        default: false
      }, 
      deletedAt:{
        type: Date,
        default: null
      }
}, {timestamps: true})

export default mongoose.model<IMemory>("Memory", memorySchema);  