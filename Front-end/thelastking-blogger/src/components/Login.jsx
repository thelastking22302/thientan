import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import {
  Button,
  Input,
  Typography,
  Card,
  CardBody,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
} from "@material-tailwind/react";
import axios from "axios";
import { setAccessToken } from "../utils/tokenMemory";

export default function LoginPage() {
  const navigate = useNavigate();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [errorModal, setErrorModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isValidPassword, setIsValidPassword] = useState({
    length: false,
    uppercase: false,
    specialChar: false,
    number: false,
  });
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = (email) => {
    const isValid = email.endsWith("@thientan.com");
    setEmailError(isValid ? "" : "Email phải kết thúc bằng @thientan.com");
    return isValid;
  };

  const validatePassword = (passwordValue) => {
    setPasswordError(passwordValue ? "" : "Mật khẩu không được để trống.");
    setIsValidPassword({
      length: passwordValue.length >= 8,
      uppercase: /[A-Z]/.test(passwordValue),
      specialChar: /[!@#$%^&*()_+{}\[\]:;'<>,.?~\-]/.test(passwordValue),
      number: /\d/.test(passwordValue),
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");

    if (!account) {
      setEmailError("Email không được để trống.");
      return;
    }
    if (!password) {
      setPasswordError("Mật khẩu không được để trống.");
      return;
    }
    if (!validateEmail(account)) {
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:8000/thientancay/users/sign-in",
        {
          account,
          password_user: password,
        },
        { withCredentials: true } // Gửi cookie refresh_token
      );

      console.log("Sign-in response:", res.data); // Log phản hồi
      const accessToken = res.data.access_token;
      if (accessToken) {
        // Kiểm tra cookie refresh_token
        console.log("Cookies after login:", document.cookie);
        setAccessToken(accessToken);
        navigate("/server");
      } else {
        throw new Error("Không nhận được access token từ server.");
      }
    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      setError(err.response?.data?.comment || "Đăng nhập thất bại");
      setErrorModal(true);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");

    if (!forgotEmail) {
      setEmailError("Email không được để trống.");
      return;
    }
    if (!newPassword) {
      setPasswordError("Mật khẩu mới không được để trống.");
      return;
    }
    if (!confirmPassword) {
      setPasswordError("Xác nhận mật khẩu không được để trống.");
      return;
    }
    if (!validateEmail(forgotEmail)) {
      return;
    }

    validatePassword(newPassword);
    const isNewPasswordComplexEnough = Object.values(isValidPassword).every(
      (valid) => valid
    );

    if (!isNewPasswordComplexEnough) {
      setError("Mật khẩu mới không đáp ứng yêu cầu phức tạp.");
      setErrorModal(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và xác nhận mật khẩu không khớp");
      setErrorModal(true);
      return;
    }

    try {
      const res = await axios.patch(
        "http://localhost:8000/thientancay/users/forgot",
        {
          email: forgotEmail,
          NewPassword: newPassword,
          ConfirmPassword: confirmPassword,
        }
      );

      console.log("Forgot password response:", res.data);
      setForgotPasswordModal(false);
      alert("Mật khẩu đã được cập nhật thành công!");
      setForgotEmail("");
      setNewPassword("");
      setConfirmPassword("");
      setIsValidPassword({
        length: false,
        uppercase: false,
        specialChar: false,
        number: false,
      });
    } catch (err) {
      console.error("Forgot password failed:", err.response?.data || err.message);
      setError(err.response?.data?.comment || "Cập nhật mật khẩu thất bại");
      setErrorModal(true);
    }
  };

  const isNewPasswordModalValid =
    Object.values(isValidPassword).every((valid) => valid) &&
    newPassword === confirmPassword;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 relative">
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 text-white p-2 hover:bg-gray-800 rounded-full transition"
      >
        <ArrowLeftIcon className="h-6 w-6" />
      </button>

      <Card
        color="white"
        shadow={true}
        className="p-10 rounded-2xl w-full max-w-md animate-fade-in"
      >
        <CardBody>
          <Typography variant="h3" color="gray" className="text-center mb-6 font-bold">
            Đăng nhập
          </Typography>

          {error && (
            <Typography color="red" className="text-center mb-4">
              {error}
            </Typography>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <Typography
                variant="small"
                color="blue-gray"
                className="font-medium block mb-1"
                htmlFor="email"
              >
                Tài Khoản
              </Typography>
              <Input
                id="email"
                type="email"
                placeholder="Nhập email @thientan.com"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                onBlur={(e) => validateEmail(e.target.value)}
                required
                error={!!emailError}
              />
              {emailError && (
                <Typography variant="small" color="red">
                  {emailError}
                </Typography>
              )}
            </div>

            <div>
              <Typography
                variant="small"
                color="blue-gray"
                className="font-medium block mb-1"
                htmlFor="password"
              >
                Mật khẩu
              </Typography>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  error={!!passwordError}
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-blue-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Ẩn" : "Hiện"}
                </button>
              </div>
              {passwordError && (
                <Typography variant="small" color="red">
                  {passwordError}
                </Typography>
              )}
            </div>

            <Button type="submit" fullWidth className="bg-blue-600 hover:bg-blue-700">
              Đăng nhập
            </Button>
            <Button
              type="button"
              fullWidth
              color="gray"
              onClick={() => setForgotPasswordModal(true)}
            >
              Quên mật khẩu?
            </Button>
          </form>
        </CardBody>
      </Card>

      <Dialog
        open={forgotPasswordModal}
        handler={() => {
          setForgotPasswordModal(false);
          setForgotEmail("");
          setNewPassword("");
          setConfirmPassword("");
          setEmailError("");
          setPasswordError("");
          setIsValidPassword({
            length: false,
            uppercase: false,
            specialChar: false,
            number: false,
          });
        }}
        size="sm"
      >
        <DialogHeader>Đặt Lại Mật Khẩu</DialogHeader>
        <DialogBody divider>
          <Typography color="gray" className="mb-4">
            Nhập email và mật khẩu mới để đặt lại mật khẩu.
          </Typography>
          <div className="mb-4">
            <Typography
              variant="small"
              color="blue-gray"
              className="font-medium block mb-1"
            >
              Email
            </Typography>
            <Input
              type="email"
              placeholder="Nhập email @thientan.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              onBlur={(e) => validateEmail(e.target.value)}
              required
              error={!!emailError}
            />
            {emailError && (
              <Typography color="red" variant="small">
                {emailError}
              </Typography>
            )}
          </div>
          <div className="mb-4">
            <Typography
              variant="small"
              color="blue-gray"
              className="font-medium block mb-1"
            >
              Mật khẩu mới
            </Typography>
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu mới"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  validatePassword(e.target.value);
                }}
                required
                error={
                  !Object.values(isValidPassword).every((v) => v) &&
                  newPassword.length > 0
                }
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-blue-gray-500"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
            {newPassword && (
              <div>
                <Typography
                  variant="small"
                  color={isValidPassword.length ? "green" : "red"}
                >
                  {isValidPassword.length ? "✔️" : "❌"} Tối thiểu 8 ký tự
                </Typography>
                <Typography
                  variant="small"
                  color={isValidPassword.uppercase ? "green" : "red"}
                >
                  {isValidPassword.uppercase ? "✔️" : "❌"} Có chữ hoa
                </Typography>
                <Typography
                  variant="small"
                  color={isValidPassword.specialChar ? "green" : "red"}
                >
                  {isValidPassword.specialChar ? "✔️" : "❌"} Có ký tự đặc biệt (@#$%^&*()_+[])
                </Typography>
                <Typography
                  variant="small"
                  color={isValidPassword.number ? "green" : "red"}
                >
                  {isValidPassword.number ? "✔️" : "❌"} Có số
                </Typography>
              </div>
            )}
          </div>
          <div className="mb-4">
            <Typography
              variant="small"
              color="blue-gray"
              className="font-medium block mb-1"
            >
              Nhập lại mật khẩu
            </Typography>
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                error={!!confirmPassword && newPassword !== confirmPassword}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-blue-gray-500"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? "Ẩn" : "Hiện"}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <Typography variant="small" color="red">
                Mật khẩu không khớp.
              </Typography>
            )}
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="gradient"
            onClick={handleForgotPassword}
            disabled={
              !!emailError ||
              !isNewPasswordModalValid ||
              !forgotEmail ||
              !newPassword ||
              !confirmPassword
            }
          >
            Cập nhật
          </Button>
          <Button
            variant="text"
            onClick={() => {
              setForgotPasswordModal(false);
              setForgotEmail("");
              setNewPassword("");
              setConfirmPassword("");
              setEmailError("");
            }}
            color="blue-gray"
          >
            Huỷ
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={errorModal} handler={() => setErrorModal(false)} size="sm">
        <DialogHeader>Lỗi</DialogHeader>
        <DialogBody divider>
          <Typography color="red">{error}</Typography>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="text"
            onClick={() => setErrorModal(false)}
            color="blue-gray"
          >
            Đóng
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}