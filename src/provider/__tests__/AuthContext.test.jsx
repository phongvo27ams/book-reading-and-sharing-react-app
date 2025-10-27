import { render, screen, waitFor, act } from "@testing-library/react";
import { useAuth } from "../AuthContext";
import { userLogin } from "../../api/authApi";
import { getUserInfo } from "../../api/userApi";
import AuthProvider from "../AuthContext";
import "@testing-library/jest-dom";

// Mock API functions
vi.mock("../../api/authApi", () => ({
  userLogin: vi.fn(),
  userLogout: vi.fn(),
  refreshToken: vi.fn(),
}));

vi.mock("../../api/userApi", () => ({
  getUserInfo: vi.fn(),
  register: vi.fn(),
}));

vi.mock("../../components/FoxCharacter/FoxCharacter", () => ({
  Messages: {
    LOGIN: "LOGIN",
    LOGIN_FAIL: "LOGIN_FAIL",
    AFTER_SIGNUP_SUCCESS: "SIGNUP_SUCCESS",
    USERNAME_EXIST: "USERNAME_EXIST",
    EMAIL_EXIST: "EMAIL_EXIST",
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// Testing Components
function TestRegisterComponent() {
  const { userRegister, message } = useAuth();
  return (
    <div>
      <p data-testid="message">{message}</p>
      <button
        onClick={() =>
          userRegister({ username: "fox", email: "fox@example.com" })
        }
      >
        Register
      </button>
    </div>
  );
}

function TestLoadingComponent() {
  const { login, userRegister, loading } = useAuth();

  return (
    <div>
      <p data-testid="loading">{loading ? "true" : "false"}</p>
      <button onClick={() => login({ username: "a", password: "b" })}>
        Login
      </button>
      <button
        onClick={() =>
          userRegister({ username: "fox", email: "fox@example.com" })
        }
      >
        Register
      </button>
    </div>
  );
}

function TestComponent() {
  const { authenticated, login, logout, message, jwt, userInfo } = useAuth();

  return (
    <div>
      <p data-testid="auth">{authenticated ? "yes" : "no"}</p>
      <p data-testid="message">{message}</p>
      <p data-testid="jwt">{jwt || "none"}</p>
      <p data-testid="username">{userInfo?.name || "guest"}</p>

      <button onClick={() => login({ username: "a", password: "b" })}>
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// Test cases for AuthContext
describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  test("Renders with default values", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId("auth")).toHaveTextContent("no");
    expect(screen.getByTestId("jwt")).toHaveTextContent("none");
    expect(screen.getByTestId("username")).toHaveTextContent("guest");
  });

  test("Login success updates state and navigates", async () => {
    // Mock userLogin returns authenticated=true and token
    userLogin.mockResolvedValue({
      data: { authenticated: true, token: "abc123" },
    });
    getUserInfo.mockResolvedValue({
      data: { name: "User001" },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Login
    await act(async () => {
      await screen.getByText("Login").click();
    });

    // Check state updates
    await waitFor(() => {
      expect(userLogin).toHaveBeenCalled();
      expect(getUserInfo).toHaveBeenCalledWith("abc123");
      expect(screen.getByTestId("auth")).toHaveTextContent("yes");
      expect(screen.getByTestId("jwt")).toHaveTextContent("abc123");
      expect(screen.getByTestId("username")).toHaveTextContent("User001");
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
  });

  test("Logout resets state", async () => {
    localStorage.setItem("jwt", "abc123");

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Mock localStorage to simulate logged in state
    await act(async () => {
      localStorage.setItem("jwt", "abc123");
    });

    // Log out
    await act(async () => {
      await screen.getByText("Logout").click();
    });

    // Check state resets
    expect(screen.getByTestId("auth")).toHaveTextContent("no");
    expect(screen.getByTestId("jwt")).toHaveTextContent("none");
    expect(screen.getByTestId("username")).toHaveTextContent("guest");
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("Login failure keeps state unchanged and sets failure message", async () => {
    // Mock userLogin with authenticated = false
    userLogin.mockResolvedValue({
      data: { authenticated: false },
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Not logged in initially
    expect(screen.getByTestId("auth")).toHaveTextContent("no");
    expect(screen.getByTestId("jwt")).toHaveTextContent("none");
    expect(screen.getByTestId("username")).toHaveTextContent("guest");

    // Login
    await act(async () => {
      await screen.getByText("Login").click();
    });

    // State should remain unchanged with failure message
    await waitFor(() => {
      expect(userLogin).toHaveBeenCalled();
      expect(screen.getByTestId("auth")).toHaveTextContent("no");
      expect(screen.getByTestId("jwt")).toHaveTextContent("none");
      expect(screen.getByTestId("username")).toHaveTextContent("guest");
      expect(screen.getByTestId("message")).toHaveTextContent("LOGIN_FAIL");
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  test("Login throws error still sets failure message", async () => {
    userLogin.mockRejectedValue(new Error("Network error"));

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      await screen.getByText("Login").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("auth")).toHaveTextContent("no");
      expect(screen.getByTestId("message")).toHaveTextContent("LOGIN_FAIL");
    });
  });

  test("userRegister success sets message to SIGNUP_SUCCESS", async () => {
    const { register } = await import("../../api/userApi");
    register.mockResolvedValue({ statusCode: 0 });

    render(
      <AuthProvider>
        <TestRegisterComponent />
      </AuthProvider>
    );

    await act(async () => {
      await screen.getByText("Register").click();
    });

    await waitFor(() => {
      expect(register).toHaveBeenCalled();
      expect(screen.getByTestId("message")).toHaveTextContent("SIGNUP_SUCCESS");
    });
  });

  test("userRegister fail with username exists sets message to USERNAME_EXIST", async () => {
    const { register } = await import("../../api/userApi");
    register.mockRejectedValue({
      response: { data: { statusCode: 1002 } },
    });

    render(
      <AuthProvider>
        <TestRegisterComponent />
      </AuthProvider>
    );

    await act(async () => {
      await screen.getByText("Register").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("message")).toHaveTextContent("USERNAME_EXIST");
    });
  });
  
  test("userRegister fail with email exists sets message to EMAIL_EXIST", async () => {
    const { register } = await import("../../api/userApi");
    register.mockRejectedValue({
      response: { data: { statusCode: 2004 } },
    });

    render(
      <AuthProvider>
        <TestRegisterComponent />
      </AuthProvider>
    );

    await act(async () => {
      await screen.getByText("Register").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("message")).toHaveTextContent("EMAIL_EXIST");
    });
  });

  test("Login sets loading true during API call and false after", async () => {
    const { userLogin } = await import("../../api/authApi");
    const { getUserInfo } = await import("../../api/userApi");

    userLogin.mockImplementation(
      () => new Promise((resolve) =>
        setTimeout(() => resolve({ data: { authenticated: true, token: "abc123" } }), 50)
      )
    );

    getUserInfo.mockResolvedValue({ data: { name: "User001" } });

    render(
      <AuthProvider>
        <TestLoadingComponent />
      </AuthProvider>
    );

    // Loading initially false
    expect(screen.getByTestId("loading")).toHaveTextContent("false");

    // Click login
    act(() => {
      screen.getByText("Login").click();
    });

    // Immediately after calling login, loading = true
    expect(screen.getByTestId("loading")).toHaveTextContent("true");

    // Wait for login to complete
    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });
  });

  test("userRegister sets loading true during API call and false after", async () => {
    const { register } = await import("../../api/userApi");

    register.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ statusCode: 0 }), 50))
    );

    render(
      <AuthProvider>
        <TestLoadingComponent />
      </AuthProvider>
    );

    // Loading initially false
    expect(screen.getByTestId("loading")).toHaveTextContent("false");

    // Click register
    act(() => {
      screen.getByText("Register").click();
    });

    // Immediately after calling register, loading = true
    expect(screen.getByTestId("loading")).toHaveTextContent("true");

    // Wait for register to complete
    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });
  });

  test("Auto logout if JWT is invalid or getUserInfo fails", async () => {
    const { getUserInfo } = await import("../../api/userApi");

    // Mock getUserInfo error (token invalid)
    getUserInfo.mockRejectedValue(new Error("401 Unauthorized"));

    // Simulate existing invalid JWT in localStorage
    localStorage.setItem("jwt", "invalid_jwt_token");

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for getUserInfo to be called and auto logout to occur
    await waitFor(() => {
      expect(getUserInfo).toHaveBeenCalledWith("invalid_jwt_token");

      // State must be logged out
      expect(screen.getByTestId("auth")).toHaveTextContent("no");
      expect(screen.getByTestId("jwt")).toHaveTextContent("none");
      expect(screen.getByTestId("username")).toHaveTextContent("guest");

      // Message should be LOGIN
      expect(screen.getByTestId("message")).toHaveTextContent("LOGIN");
    });

    // Must navigate to home
    expect(mockNavigate).toHaveBeenCalledWith("/");
  });

  test("State remains correct after multiple login/logout sequences", async () => {
    const { userLogin } = await import("../../api/authApi");
    const { getUserInfo } = await import("../../api/userApi");

    // Mock login 1: success
    userLogin.mockResolvedValueOnce({ data: { authenticated: true, token: "token1" } });
    getUserInfo.mockResolvedValueOnce({ data: { name: "User1" } });

    // Mock login 2: fail
    userLogin.mockResolvedValueOnce({ data: { authenticated: false } });

    // Mock login 3: success
    userLogin.mockResolvedValueOnce({ data: { authenticated: true, token: "token2" } });
    getUserInfo.mockResolvedValueOnce({ data: { name: "User2" } });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // --- Login 1 ---
    await act(async () => screen.getByText("Login").click());
    await waitFor(() => {
      expect(screen.getByTestId("auth")).toHaveTextContent("yes");
      expect(screen.getByTestId("jwt")).toHaveTextContent("token1");
      expect(screen.getByTestId("username")).toHaveTextContent("User1");
    });

    // --- Logout 1 ---
    await act(async () => screen.getByText("Logout").click());
    await waitFor(() => {
      expect(screen.getByTestId("auth")).toHaveTextContent("no");
      expect(screen.getByTestId("jwt")).toHaveTextContent("none");
      expect(screen.getByTestId("username")).toHaveTextContent("guest");
    });

    // --- Login 2 (fail) ---
    await act(async () => screen.getByText("Login").click());
    await waitFor(() => {
      // State must remain logged out with failure message
      expect(screen.getByTestId("auth")).toHaveTextContent("no");
      expect(screen.getByTestId("jwt")).toHaveTextContent("none");
      expect(screen.getByTestId("username")).toHaveTextContent("guest");
      expect(screen.getByTestId("message")).toHaveTextContent("LOGIN_FAIL");
    });

    // --- Login 3 (success) ---
    await act(async () => screen.getByText("Login").click());
    await waitFor(() => {
      expect(screen.getByTestId("auth")).toHaveTextContent("yes");
      expect(screen.getByTestId("jwt")).toHaveTextContent("token2");
      expect(screen.getByTestId("username")).toHaveTextContent("User2");
    });

    // --- Last logout ---
    await act(async () => screen.getByText("Logout").click());
    await waitFor(() => {
      expect(screen.getByTestId("auth")).toHaveTextContent("no");
      expect(screen.getByTestId("jwt")).toHaveTextContent("none");
      expect(screen.getByTestId("username")).toHaveTextContent("guest");
    });
  });
});