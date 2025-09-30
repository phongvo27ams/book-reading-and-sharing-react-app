import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import LoginPage from "../LoginPage";
import { Messages } from "../../../components/FoxCharacter/FoxCharacter";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";

// Mock useAuth
let mockLogin = vi.fn();
let mockSetMessage = vi.fn();

vi.mock("../../../provider/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
    loading: false,
    setMessage: mockSetMessage,
  }),
}));

// Mock assets
vi.mock("../../assets/fox.png", () => "fox.png");
vi.mock("../../assets/google.png", () => "google.png");
vi.mock("../../assets/facebook.png", () => "facebook.png");

describe("LoginPage", () => {
  beforeEach(() => {
    mockLogin = vi.fn();
    mockSetMessage = vi.fn();
    vi.clearAllMocks();
  });

  const invalidUsernames = [
    "short",             // <6 ký tự
    "a".repeat(33),      // >32 ký tự
    "user!",             // Ký tự đặc biệt
    "user@name",         // Ký tự đặc biệt
    "user name",         // Khoảng trắng
  ];

  const validUsernames = [
    "user123",
    "User_01",
    "username32characterslonggg",
  ];

  const invalidPasswords = [
    "short",             // <6 ký tự
    "a".repeat(33),      // >32 ký tự
    "abcdef",            // chỉ chữ cái
    "123456",            // chỉ số
    "!!!!!!",            // chỉ ký tự đặc biệt
    "abc123",            // thiếu ký tự đặc biệt
    "abc!@#",            // thiếu số
    "123!@#",            // thiếu chữ cái
    "pass word1!",       // chứa khoảng trắng
  ];

  const validPasswords = [
    "Abc123!",          // chữ cái + số + ký tự đặc biệt
    "Password1@",       
    "Aa1!@#$%^&*",      // dài hơn 6, có đủ điều kiện
    "Zx9_@1234",        
  ];

  test("Renders all elements correctly", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText("LOGIN")).toBeInTheDocument();
    expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByText(/Join the Base/i)).toBeInTheDocument();
    expect(screen.getByText(/Forgot password/i)).toBeInTheDocument();
    expect(screen.getByText(/Become a Fox/i)).toBeInTheDocument();
  });

  test("Calls setMessage(Messages.LOGIN) on mount", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(mockSetMessage).toHaveBeenCalledWith(Messages.LOGIN);
  });

  test("Login with empty input sets BLANK message", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText(/Join the Base/i));

    await waitFor(() => {
      expect(mockSetMessage).toHaveBeenCalledWith(Messages.BLANK);
      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  test("Login success clears inputs and calls login", async () => {
    mockLogin.mockResolvedValue(true);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(usernameInput, { target: { value: "user1" } });
    fireEvent.change(passwordInput, { target: { value: "pass1" } });

    fireEvent.click(screen.getByText(/Join the Base/i));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ username: "user1", password: "pass1" });
      expect(usernameInput.value).toBe("");
      expect(passwordInput.value).toBe("");
    });
  });

  test("Login failure does not clear inputs", async () => {
    mockLogin.mockResolvedValue(false);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(usernameInput, { target: { value: "user2" } });
    fireEvent.change(passwordInput, { target: { value: "pass2" } });

    fireEvent.click(screen.getByText(/Join the Base/i));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ username: "user2", password: "pass2" });
      expect(usernameInput.value).toBe("user2");
      expect(passwordInput.value).toBe("pass2");
    });
  });

  test("Loader reflects loading state", () => {
    // Override implementation for only this test
    vi.mock("../../../provider/AuthContext", () => ({
      useAuth: () => ({
        login: mockLogin,
        loading: true,
        setMessage: mockSetMessage,
      }),
    }));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const loaderContainer = screen.getByText(/Join the Base/i).closest("form");
    expect(loaderContainer).toBeInTheDocument();
  });

  test("Links navigate and set messages correctly", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const createAccountLink = screen.getByText(/Become a Fox/i).closest("a");
    fireEvent.click(createAccountLink);
    expect(mockSetMessage).toHaveBeenCalledWith(Messages.SIGNUP);

    const forgotLink = screen.getByText(/Forgot password/i).closest("a");
    expect(forgotLink).toHaveAttribute("href", "/auth/reset-password");
  });

  test("Login with empty username and password sets BLANK message", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    // Click login button without entering username or password1
    fireEvent.click(screen.getByText(/Join the Base/i));

    await waitFor(() => {
      // login() was not called
      expect(mockLogin).not.toHaveBeenCalled();

      // setMessage was called with Messages.BLANK
      expect(mockSetMessage).toHaveBeenCalledWith(Messages.BLANK);
    });
  });

  test("Login with whitespace-only input sets BLANK message", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);

    fireEvent.change(usernameInput, { target: { value: "   " } });
    fireEvent.change(passwordInput, { target: { value: "   " } });

    fireEvent.click(screen.getByText(/Join the Base/i));

    await waitFor(() => {
      expect(mockLogin).not.toHaveBeenCalled();
      expect(mockSetMessage).toHaveBeenCalledWith(Messages.BLANK);
    });
  });

  test("Spam click on login with empty input triggers BLANK message once", async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const loginButton = screen.getByText(/Join the Base/i);

    // Spam click
    fireEvent.click(loginButton);
    fireEvent.click(loginButton);
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockLogin).not.toHaveBeenCalled();
      // setMessage BLANK only once, despite multiple clicks
      expect(mockSetMessage).toHaveBeenCalledWith(Messages.BLANK);
    });
  });

  test("Spam click on login with valid input calls login once", async () => {
    // Mock login returns promise resolve after delay
    mockLogin = vi.fn(() => new Promise((resolve) => setTimeout(() => resolve(true), 50)));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText(/Username/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const loginButton = screen.getByText(/Join the Base/i);

    fireEvent.change(usernameInput, { target: { value: "user" } });
    fireEvent.change(passwordInput, { target: { value: "pass" } });

    // Spam click
    fireEvent.click(loginButton);
    fireEvent.click(loginButton);
    fireEvent.click(loginButton);

    await waitFor(() => {
      // Login called once despite multiple clicks
      expect(mockLogin).toHaveBeenCalledTimes(1);
    });
  });

  test.each(invalidUsernames)(
    "Reject invalid username: '%s'",
    async (username) => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const usernameInput = screen.getByLabelText(/Username/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByText(/Join the Base/i);

      fireEvent.change(usernameInput, { target: { value: username } });
      fireEvent.change(passwordInput, { target: { value: "ValidPass1" } });

      fireEvent.click(loginButton);

      await waitFor(() => {
        // login() was not called
        expect(mockLogin).not.toHaveBeenCalled();
        // setMessage was called with Messages.BLANK
        expect(mockSetMessage).toHaveBeenCalledWith(Messages.BLANK);
      });
    }
  );

  test.each(validUsernames)(
    "Accept valid username: '%s'",
    async (username) => {
      mockLogin.mockResolvedValue(true);

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const usernameInput = screen.getByLabelText(/Username/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByText(/Join the Base/i);

      fireEvent.change(usernameInput, { target: { value: username } });
      fireEvent.change(passwordInput, { target: { value: "ValidPass1" } });

      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          username,
          password: "ValidPass1",
        });
      });
    }
  );

  test.each(invalidPasswords)(
    "Reject invalid password: '%s'",
    async (password) => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const usernameInput = screen.getByLabelText(/Username/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByText(/Join the Base/i);

      fireEvent.change(usernameInput, { target: { value: "ValidUser" } });
      fireEvent.change(passwordInput, { target: { value: password } });

      fireEvent.click(loginButton);

      await waitFor(() => {
        // login() was not called
        expect(mockLogin).not.toHaveBeenCalled();
        // setMessage was called with Messages.BLANK
        expect(mockSetMessage).toHaveBeenCalledWith(Messages.BLANK);
      });
    }
  );

  test.each(validPasswords)(
    "Accept valid password: '%s'",
    async (password) => {
      mockLogin.mockResolvedValue(true);

      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      );

      const usernameInput = screen.getByLabelText(/Username/i);
      const passwordInput = screen.getByLabelText(/Password/i);
      const loginButton = screen.getByText(/Join the Base/i);

      fireEvent.change(usernameInput, { target: { value: "ValidUser" } });
      fireEvent.change(passwordInput, { target: { value: password } });

      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          username: "ValidUser",
          password,
        });
      });
    }
  );
});