import React, { useState } from 'react';
import { Typography, Button, ListItemText, ListItem, TextField, Box, CircularProgress, Divider } from '@mui/material';
import APIs from '../../configs/APIs'; // Import APIs từ cấu hình của bạn

const Comment = ({ comment }) => {
  const [showReplyInput, setShowReplyInput] = useState(false); // Trạng thái hiển thị ô nhập nội dung trả lời
  const [replyContent, setReplyContent] = useState(''); // Nội dung của câu trả lời
  const [isSubmitting, setIsSubmitting] = useState(false); // Trạng thái loading khi gửi phản hồi
  const [replies, setReplies] = useState(comment.replies || []); // Danh sách câu trả lời ban đầu
  const [hasMoreReplies, setHasMoreReplies] = useState(replies.length === 0); // Trạng thái hiển thị nút "Xem thêm"
  const [loadingMore, setLoadingMore] = useState(false); // Trạng thái loading khi tải thêm phản hồi

  // Hàm để xử lý khi nhấn nút "Trả lời"
  const handleReplyClick = () => {
    setShowReplyInput(!showReplyInput);
  };

  // Hàm xử lý khi nhấn nút "Gửi"
  const handleSendReply = async () => {
    setIsSubmitting(true); // Bật trạng thái loading khi gửi phản hồi
    try {
      const replyData = {
        content: replyContent,
        parentReviewId: comment.id, // ID của bình luận cha
        patientId: 1, // Cập nhật patientId phù hợp với dữ liệu người dùng của bạn
      };

      // Gửi yêu cầu POST đến API
      const res = await APIs.post(`http://localhost:3000/reviews/reply`, replyData);

      // Cập nhật danh sách phản hồi
      setReplies([...replies, res.data]);

      setReplyContent(''); // Xóa nội dung trả lời sau khi gửi
      setShowReplyInput(false); // Đóng khung nhập trả lời
    } catch (error) {
      console.error("Lỗi khi thêm phản hồi:", error);
    } finally {
      setIsSubmitting(false); // Tắt trạng thái loading sau khi gửi xong
    }
  };

  // Hàm xử lý khi nhấn nút "Xem thêm phản hồi"
  const handleShowMoreReplies = async () => {
    setLoadingMore(true); // Bắt đầu trạng thái loading khi đang lấy dữ liệu
    try {
      // Gọi API để lấy thêm các phản hồi của comment
      const res = await APIs.get(`http://localhost:3000/reviews/replies/${comment.id}`);

      // Cập nhật danh sách phản hồi
      setReplies((prevReplies) => [...prevReplies, ...res.data]);

      // Kiểm tra nếu không còn phản hồi để tải thì ẩn nút "Xem thêm"
      if (res.data.length === 0) {
        setHasMoreReplies(false);
      }
    } catch (error) {
      console.error("Lỗi khi lấy bình luận con:", error);
    } finally {
      setLoadingMore(false); // Tắt trạng thái loading khi đã hoàn thành
    }
  };

  // Kiểm tra xem dữ liệu comment có tồn tại trước khi render
  if (!comment || !comment.patient || !comment.patient.user) {
    return <Typography variant="body2" color="error">Dữ liệu không hợp lệ</Typography>;
  }

  return (
    <Box sx={{ mb: 3 }}>
      <ListItem key={comment.id} alignItems="flex-start">
        <ListItemText
          primary={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              {`Người dùng: ${comment.patient.user.firstName} ${comment.patient.user.lastName}`}
            </Typography>
          }
          secondary={
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 1 }}>
              {comment.content}
            </Typography>
          }
        />
      </ListItem>

      <Box sx={{ ml: 6 }}>
        {/* Nút trả lời */}
        <Button onClick={handleReplyClick} sx={{ mt: 1 }}>
          <Typography variant="body2" color="primary">Trả lời</Typography>
        </Button>

        {/* Hiển thị ô nhập nội dung trả lời khi nhấn "Trả lời" */}
        {showReplyInput && (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Nhập câu trả lời của bạn"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              variant="outlined"
              multiline
              rows={2}
            />
            <Button sx={{ mt: 1 }} variant="contained" onClick={handleSendReply} disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} /> : 'Gửi'}
            </Button>
          </Box>
        )}

        {/* Hiển thị danh sách các câu trả lời */}
        <Box sx={{ mt: 2 }}>
          {replies.map((reply) => (
            <Comment comment={reply} key={reply.id} />
          ))}
        </Box>

        {/* Hiển thị nút "Xem thêm phản hồi" nếu còn phản hồi để tải */}
        {hasMoreReplies && !loadingMore && (
          <Button onClick={handleShowMoreReplies} >
            Xem thêm phản hồi
          </Button>
        )}

        {/* Hiển thị loading khi đang tải thêm phản hồi */}
        {loadingMore && <CircularProgress size={24} sx={{ mt: 2 }} />}
      </Box>

      {/* Divider để ngăn cách từng bình luận */}
      <Divider sx={{ mt: 3 }} />
    </Box>
  );
};

export default Comment;
