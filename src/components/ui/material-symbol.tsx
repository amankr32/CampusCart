import React from "react";
import { clsx } from "clsx";

export interface MaterialSymbolProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: number | string;
  filled?: boolean;
  weight?: 100 | 200 | 300 | 400 | 500 | 600 | 700;
  grade?: -25 | 0 | 200;
  opticalSize?: 20 | 24 | 40 | 48;
  className?: string;
}

export function MaterialSymbol({
  name,
  className,
  size,
  filled = false,
  weight,
  grade = 0,
  opticalSize,
  style,
  ...props
}: MaterialSymbolProps) {
  const fontVariationSettings = [
    `'FILL' ${filled ? 1 : 0}`,
    `'wght' ${weight ?? 400}`,
    `'GRAD' ${grade}`,
    `'opsz' ${opticalSize ?? (typeof size === "number" ? Math.min(Math.max(size, 20), 48) : 24)}`,
  ].join(", ");

  const customStyle: React.CSSProperties = {
    fontVariationSettings,
    ...(size ? { fontSize: typeof size === "number" ? `${size}px` : size } : {}),
    ...style,
  };

  return (
    <span
      className={clsx(
        "material-symbols-rounded select-none leading-none shrink-0 inline-flex items-center justify-center",
        filled && "filled",
        className
      )}
      style={customStyle}
      aria-hidden={props["aria-label"] ? undefined : true}
      {...props}
    >
      {name}
    </span>
  );
}

export type IconProps = Omit<MaterialSymbolProps, "name">;

// ---------------------------------------------------------------------------
// Google Material Symbols Icon Registry
// ---------------------------------------------------------------------------
export const Bell = (props: IconProps) => <MaterialSymbol name="notifications" {...props} />;
export const ChevronDown = (props: IconProps) => <MaterialSymbol name="expand_more" {...props} />;
export const ChevronUp = (props: IconProps) => <MaterialSymbol name="expand_less" {...props} />;
export const ChevronLeft = (props: IconProps) => <MaterialSymbol name="chevron_left" {...props} />;
export const ChevronRight = (props: IconProps) => <MaterialSymbol name="chevron_right" {...props} />;
export const Compass = (props: IconProps) => <MaterialSymbol name="explore" {...props} />;
export const LogOut = (props: IconProps) => <MaterialSymbol name="logout" {...props} />;
export const Menu = (props: IconProps) => <MaterialSymbol name="menu" {...props} />;
export const MessageSquare = (props: IconProps) => <MaterialSymbol name="chat_bubble" {...props} />;
export const MessageCircle = (props: IconProps) => <MaterialSymbol name="chat" {...props} />;
export const MessagesSquare = (props: IconProps) => <MaterialSymbol name="forum" {...props} />;
export const Plus = (props: IconProps) => <MaterialSymbol name="add" {...props} />;
export const PlusCircle = (props: IconProps) => <MaterialSymbol name="add_circle" {...props} />;
export const LayoutDashboard = (props: IconProps) => <MaterialSymbol name="dashboard" {...props} />;
export const ListOrdered = (props: IconProps) => <MaterialSymbol name="format_list_numbered" {...props} />;
export const Receipt = (props: IconProps) => <MaterialSymbol name="receipt_long" {...props} />;
export const Search = (props: IconProps) => <MaterialSymbol name="search" {...props} />;
export const Settings = (props: IconProps) => <MaterialSymbol name="settings" {...props} />;
export const ShieldAlert = (props: IconProps) => <MaterialSymbol name="gpp_bad" {...props} />;
export const ShieldCheck = (props: IconProps) => <MaterialSymbol name="verified_user" {...props} />;
export const ShoppingBag = (props: IconProps) => <MaterialSymbol name="shopping_bag" {...props} />;
export const Package = (props: IconProps) => <MaterialSymbol name="inventory_2" {...props} />;
export const History = (props: IconProps) => <MaterialSymbol name="history" {...props} />;
export const Store = (props: IconProps) => <MaterialSymbol name="storefront" {...props} />;
export const User = (props: IconProps) => <MaterialSymbol name="person" {...props} />;
export const Users = (props: IconProps) => <MaterialSymbol name="group" {...props} />;
export const Heart = (props: IconProps) => <MaterialSymbol name="favorite" {...props} />;
export const X = (props: IconProps) => <MaterialSymbol name="close" {...props} />;
export const XCircle = (props: IconProps) => <MaterialSymbol name="cancel" {...props} />;
export const CheckCircle = (props: IconProps) => <MaterialSymbol name="check_circle" {...props} />;
export const CheckCircle2 = (props: IconProps) => <MaterialSymbol name="check_circle" {...props} />;
export const Check = (props: IconProps) => <MaterialSymbol name="check" {...props} />;
export const CheckCheck = (props: IconProps) => <MaterialSymbol name="done_all" {...props} />;
export const Star = (props: IconProps) => <MaterialSymbol name="star" {...props} />;
export const MapPin = (props: IconProps) => <MaterialSymbol name="location_on" {...props} />;
export const IndianRupee = (props: IconProps) => <MaterialSymbol name="currency_rupee" {...props} />;
export const Mail = (props: IconProps) => <MaterialSymbol name="mail" {...props} />;
export const MailCheck = (props: IconProps) => <MaterialSymbol name="mark_email_read" {...props} />;
export const Lock = (props: IconProps) => <MaterialSymbol name="lock" {...props} />;
export const Loader2 = ({ className, ...props }: IconProps) => (
  <MaterialSymbol name="progress_activity" className={clsx("animate-spin", className)} {...props} />
);
export const ArrowLeft = (props: IconProps) => <MaterialSymbol name="arrow_back" {...props} />;
export const ArrowRight = (props: IconProps) => <MaterialSymbol name="arrow_forward" {...props} />;
export const ArrowUpDown = (props: IconProps) => <MaterialSymbol name="swap_vert" {...props} />;
export const Eye = (props: IconProps) => <MaterialSymbol name="visibility" {...props} />;
export const EyeOff = (props: IconProps) => <MaterialSymbol name="visibility_off" {...props} />;
export const AlertCircle = (props: IconProps) => <MaterialSymbol name="error" {...props} />;
export const AlertTriangle = (props: IconProps) => <MaterialSymbol name="warning" {...props} />;
export const AlertOctagon = (props: IconProps) => <MaterialSymbol name="report" {...props} />;
export const Sun = (props: IconProps) => <MaterialSymbol name="light_mode" {...props} />;
export const Moon = (props: IconProps) => <MaterialSymbol name="dark_mode" {...props} />;
export const Palette = (props: IconProps) => <MaterialSymbol name="palette" {...props} />;
export const UserX = (props: IconProps) => <MaterialSymbol name="person_off" {...props} />;
export const CreditCard = (props: IconProps) => <MaterialSymbol name="credit_card" {...props} />;
export const Sparkles = (props: IconProps) => <MaterialSymbol name="auto_awesome" {...props} />;
export const BookOpen = (props: IconProps) => <MaterialSymbol name="menu_book" {...props} />;
export const Clock = (props: IconProps) => <MaterialSymbol name="schedule" {...props} />;
export const Tag = (props: IconProps) => <MaterialSymbol name="sell" {...props} />;
export const Upload = (props: IconProps) => <MaterialSymbol name="upload" {...props} />;
export const Copy = (props: IconProps) => <MaterialSymbol name="content_copy" {...props} />;
export const RefreshCw = (props: IconProps) => <MaterialSymbol name="refresh" {...props} />;
export const RotateCw = (props: IconProps) => <MaterialSymbol name="sync" {...props} />;
export const ExternalLink = (props: IconProps) => <MaterialSymbol name="open_in_new" {...props} />;
export const BadgePercent = (props: IconProps) => <MaterialSymbol name="percent" {...props} />;
export const Handshake = (props: IconProps) => <MaterialSymbol name="handshake" {...props} />;
export const UserPlus = (props: IconProps) => <MaterialSymbol name="person_add" {...props} />;
export const ListPlus = (props: IconProps) => <MaterialSymbol name="post_add" {...props} />;
export const PackageSearch = (props: IconProps) => <MaterialSymbol name="search_off" {...props} />;
export const ImageOff = (props: IconProps) => <MaterialSymbol name="hide_image" {...props} />;
export const Image = (props: IconProps) => <MaterialSymbol name="image" {...props} />;
export const ImagePlus = (props: IconProps) => <MaterialSymbol name="add_photo_alternate" {...props} />;
export const LayoutGrid = (props: IconProps) => <MaterialSymbol name="grid_view" {...props} />;
export const List = (props: IconProps) => <MaterialSymbol name="view_list" {...props} />;
export const Send = (props: IconProps) => <MaterialSymbol name="send" {...props} />;
export const Paperclip = (props: IconProps) => <MaterialSymbol name="attach_file" {...props} />;
export const Smile = (props: IconProps) => <MaterialSymbol name="sentiment_satisfied" {...props} />;
export const Trash2 = (props: IconProps) => <MaterialSymbol name="delete" {...props} />;
export const Edit3 = (props: IconProps) => <MaterialSymbol name="edit" {...props} />;
export const Filter = (props: IconProps) => <MaterialSymbol name="tune" {...props} />;
export const Share2 = (props: IconProps) => <MaterialSymbol name="share" {...props} />;
export const Flag = (props: IconProps) => <MaterialSymbol name="flag" {...props} />;
export const Calendar = (props: IconProps) => <MaterialSymbol name="calendar_today" {...props} />;
export const Camera = (props: IconProps) => <MaterialSymbol name="photo_camera" {...props} />;
export const Zap = (props: IconProps) => <MaterialSymbol name="bolt" {...props} />;
export const Flame = (props: IconProps) => <MaterialSymbol name="local_fire_department" {...props} />;
export const ArrowUpRight = (props: IconProps) => <MaterialSymbol name="north_east" {...props} />;
export const TrendingUp = (props: IconProps) => <MaterialSymbol name="trending_up" {...props} />;
export const Home = (props: IconProps) => <MaterialSymbol name="home" {...props} />;
export const MoreVertical = (props: IconProps) => <MaterialSymbol name="more_vert" {...props} />;
export const SearchX = (props: IconProps) => <MaterialSymbol name="search_off" {...props} />;
export const Info = (props: IconProps) => <MaterialSymbol name="info" {...props} />;
export const SlidersHorizontal = (props: IconProps) => <MaterialSymbol name="tune" {...props} />;
export const Sliders = (props: IconProps) => <MaterialSymbol name="tune" {...props} />;
export const Checkbox = (props: IconProps) => <MaterialSymbol name="check_box" {...props} />;
export const CheckboxBlank = (props: IconProps) => <MaterialSymbol name="check_box_outline_blank" {...props} />;
export const Verified = (props: IconProps) => <MaterialSymbol name="verified" {...props} />;

export const Bike = (props: IconProps) => <MaterialSymbol name="pedal_bike" {...props} />;
export const Laptop = (props: IconProps) => <MaterialSymbol name="laptop_mac" {...props} />;
export const BedDouble = (props: IconProps) => <MaterialSymbol name="bed" {...props} />;
export const PenTool = (props: IconProps) => <MaterialSymbol name="draw" {...props} />;
export const Dumbbell = (props: IconProps) => <MaterialSymbol name="fitness_center" {...props} />;
export const Wallet = (props: IconProps) => <MaterialSymbol name="account_balance_wallet" {...props} />;
export const Award = (props: IconProps) => <MaterialSymbol name="workspace_premium" {...props} />;

// Named Icon* aliases for semantic clarity
export const IconSearch = Search;
export const IconShieldCheck = ShieldCheck;
export const IconVerified = Verified;
export const IconMapPin = MapPin;
export const IconRupee = IndianRupee;
export const IconChat = MessageSquare;
export const IconHeart = Heart;
export const IconSparkles = Sparkles;
export const IconStar = Star;
export const IconClock = Clock;
export const IconBook = BookOpen;
export const IconStore = Store;
export const IconImageOff = ImageOff;
export const IconUpload = Upload;
export const IconClose = X;
export const IconChevronLeft = ChevronLeft;
export const IconChevronRight = ChevronRight;
export const IconChevronDown = ChevronDown;
export const IconChevronUp = ChevronUp;
export const IconArrowLeft = ArrowLeft;
export const IconArrowRight = ArrowRight;
export const IconLock = Lock;
export const IconMail = Mail;
export const IconUser = User;
export const IconUsers = Users;
export const IconEye = Eye;
export const IconEyeOff = EyeOff;
export const IconCheckCircle = CheckCircle;
export const IconAlertCircle = AlertCircle;
export const IconAlertTriangle = AlertTriangle;
export const IconLoader = Loader2;
export const IconRefresh = RefreshCw;
export const IconCopy = Copy;
export const IconGrid = LayoutGrid;
export const IconList = List;
export const IconPlus = Plus;
export const IconShoppingBag = ShoppingBag;
export const IconTrash = Trash2;
export const IconEdit = Edit3;
export const IconExternalLink = ExternalLink;
