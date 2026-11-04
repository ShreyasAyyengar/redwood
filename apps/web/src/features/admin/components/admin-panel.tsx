import { Tabs, TabsContent, TabsList, TabsTrigger } from "@redwood/shad-ui/components/tabs";
import { AttributeEditor } from "./attributes/attribute-editor";
import CSVUpload from "./csv/csv-upload";
import { RoomGroupEditor } from "./groups/room-group-editor";
import { MaintenanceFieldsEditor } from "./maintenance/maintenance-fields-editor";
import Overview from "./overview/overview";
import UserEditor from "./users/user-editor";

const supervisorTabs = ["overview", "csv", "attributes", "groups", "maintenance"];

export default function AdminPanel({ isAdmin }: { isAdmin: boolean }) {
  const storeLastTab = (tab: string) => localStorage.setItem("adminLastTab", tab);
  const storedTab = localStorage.getItem("adminLastTab");
  const allowedTabs = isAdmin ? [...supervisorTabs, "users"] : supervisorTabs;
  const lastTab = storedTab && allowedTabs.includes(storedTab) ? storedTab : "overview";
  return (
    <div className="flex min-h-0 w-full justify-center">
      <Tabs
        className="min-h-0 w-full max-w-[1600px] flex-col md:flex-row"
        defaultValue={lastTab}
        orientation="vertical"
        onValueChange={storeLastTab}
      >
        <TabsList className="max-w-full shrink-0 flex-wrap group-data-[orientation=vertical]/tabs:flex-row md:group-data-[orientation=vertical]/tabs:flex-col">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          {isAdmin && <TabsTrigger value="users">Users</TabsTrigger>}
          <TabsTrigger value="attributes">Room Attributes</TabsTrigger>
          <TabsTrigger value="groups">Room Groups</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance Fields</TabsTrigger>
          <TabsTrigger disabled value="statistics">
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Overview />
        </TabsContent>
        <TabsContent value="csv">
          <CSVUpload />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="users">
            <UserEditor />
          </TabsContent>
        )}
        <TabsContent value="attributes">
          <AttributeEditor />
        </TabsContent>
        <TabsContent value="groups">
          <RoomGroupEditor />
        </TabsContent>
        <TabsContent value="maintenance" forceMount className="min-w-0 data-[state=inactive]:hidden">
          <MaintenanceFieldsEditor />
        </TabsContent>
        {/*<TabsContent value="statistics">*/}
        {/*  <Statistics />*/}
        {/*</TabsContent>*/}
      </Tabs>
    </div>
  );
}
