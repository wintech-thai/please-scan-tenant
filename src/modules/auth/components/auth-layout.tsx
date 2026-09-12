import Image from "next/image";

type Props = {
  children: React.ReactNode;
  header: React.ReactNode;
};

export const AuthLayout = ({ children, header }: Props) => {
  return (
    <div className="h-full w-full flex items-center justify-center">
      <div className="px-2 md:px-0 max-w-[550px] w-full">
        {/* header */}
        <div className="flex items-center gap-x-2">
          <div className="rounded-md bg-gray-100 p-2">
            <Image
              src="/logo.png"
              alt="Please Scan"
              width={100}
              height={100}
            />
          </div>
          <div>
            <h3 className="text-3xl font-semibold">
              Please Scan
            </h3>
            <h4 className="text-base text-gray-500">
              Back office system
            </h4>
          </div>
        </div>

        <h3 className="text-left text-lg font-semibold my-3">
          {header}
        </h3>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};
