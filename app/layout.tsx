import type {Metadata} from "next"; import "./globals.css";
export const metadata:Metadata={title:"LabLink | Research, connected",description:"Discover shared research equipment and coordinate lab access."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
